import express from "express";
import cors from "cors";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "data.json");
const PORT = process.env.PORT || 3001;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const TTL_SECONDS = 60 * 60 * 24 * 365; // tours are kept for a year unless the guide deletes them sooner (Redis only)

/* ------------------------------------------------------------------ storage */
// Two interchangeable stores:
//  - file  : a JSON file next to this script. Fine on your own computer, but a free
//            host erases it when the server restarts, redeploys or goes to sleep.
//  - redis : Upstash Redis (free tier). Permanent. Used automatically when the
//            UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN variables are set.
function makeFileStore() {
  let data = {};
  try { data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")); } catch { data = {}; }
  let timer = null;
  const save = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try { fs.writeFileSync(DATA_FILE, JSON.stringify(data)); } catch (e) { console.error("save failed", e); }
    }, 500);
  };
  return {
    kind: "file",
    async get(k) { return k in data ? data[k] : null; },
    async set(k, v) { data[k] = v; save(); },
    async del(k) { delete data[k]; save(); },
    async keys(prefix) { return Object.keys(data).filter((k) => k.startsWith(prefix)); },
    async delMany(keys) { keys.forEach((k) => delete data[k]); save(); },
  };
}

function makeRedisStore() {
  async function cmd(args) {
    const r = await fetch(UPSTASH_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });
    const j = await r.json();
    if (!r.ok || j.error) throw new Error(j.error || `redis ${r.status}`);
    return j.result;
  }
  return {
    kind: "redis",
    async get(k) { return (await cmd(["GET", k])) ?? null; },
    async set(k, v) { await cmd(["SET", k, v, "EX", TTL_SECONDS]); },
    async del(k) { await cmd(["DEL", k]); },
    async keys(prefix) { return (await cmd(["KEYS", `${prefix}*`])) || []; },
    async delMany(keys) {
      for (let i = 0; i < keys.length; i += 100) await cmd(["DEL", ...keys.slice(i, i + 100)]);
    },
    async mget(keys) { return keys.length ? await cmd(["MGET", ...keys]) : []; },
  };
}

const store = UPSTASH_URL && UPSTASH_TOKEN ? makeRedisStore() : makeFileStore();

// rows under a prefix, never including the secret guide-PIN record
async function rowsByPrefix(prefix) {
  const keys = (await store.keys(prefix)).filter((k) => !k.endsWith(":auth"));
  if (keys.length === 0) return [];
  const vals = store.mget ? await store.mget(keys) : await Promise.all(keys.map((k) => store.get(k)));
  return keys.map((k, i) => ({ key: k, value: vals[i] })).filter((x) => x.value != null);
}

/* ---------------------------------------------------------------------- app */
const app = express();
app.set("trust proxy", 1);
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Only tour data is allowed: keys look like  tour:4721  or  tour:4721:chat
const KEY_RE = /^tour:\d{4}(:[A-Za-z0-9_:-]{1,80})?$/;
const PREFIX_RE = /^tour:\d{4}:[A-Za-z0-9_:-]{0,40}$/;
const MAX_VALUE_CHARS = 400000;

const wrap = (fn) => (req, res) => fn(req, res).catch((err) => {
  console.error(err);
  res.status(500).json({ error: "server error" });
});

// simple in-memory rate limiter
const hits = new Map();
function allow(id, limit, windowMs) {
  const now = Date.now();
  const arr = (hits.get(id) || []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) { hits.set(id, arr); return false; }
  arr.push(now);
  hits.set(id, arr);
  return true;
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, storage: store.kind, ai: Boolean(ANTHROPIC_API_KEY) });
});

app.get("/api/storage/:key", wrap(async (req, res) => {
  const key = req.params.key;
  if (!KEY_RE.test(key) || key.endsWith(":auth")) return res.status(400).json({ error: "bad key" });
  const value = await store.get(key);
  if (value == null) return res.status(404).json({ error: "not found" });
  res.json({ key, value, shared: true });
}));

app.post("/api/storage", wrap(async (req, res) => {
  const { key, value } = req.body || {};
  if (typeof key !== "string" || !KEY_RE.test(key) || key.endsWith(":auth")) return res.status(400).json({ error: "bad key" });
  if (typeof value !== "string" || value.length > MAX_VALUE_CHARS) return res.status(400).json({ error: "bad value" });
  await store.set(key, value);
  res.json({ key, value, shared: true });
}));

app.delete("/api/storage/:key", wrap(async (req, res) => {
  const key = req.params.key;
  if (!KEY_RE.test(key) || key.endsWith(":auth")) return res.status(400).json({ error: "bad key" });
  await store.del(key);
  res.json({ key, deleted: true, shared: true });
}));

// Read every row under one tour's prefix, e.g. all live locations:  tour:4721:loc:
app.get("/api/storage-prefix", wrap(async (req, res) => {
  const prefix = String(req.query.prefix || "");
  if (!PREFIX_RE.test(prefix)) return res.status(400).json({ error: "bad prefix" });
  res.json({ prefix, items: await rowsByPrefix(prefix) });
}));

/* ------------------------------------------------------- guide PIN: create / sign in / delete */
// The guide chooses a 4-6 digit PIN when creating a tour. It is stored only as a salted hash and can
// never be read back through the storage API. It is needed to sign in as guide on another phone and to
// delete the tour.
const creating = new Set();
const hashPin = (pin, saltHex) => crypto.scryptSync(pin, Buffer.from(saltHex, "hex"), 32).toString("hex");
async function verifyPin(code, pin) {
  const raw = await store.get(`tour:${code}:auth`);
  if (!raw) return false;
  try {
    const { salt, hash } = JSON.parse(raw);
    const a = Buffer.from(hashPin(pin, salt), "hex");
    const b = Buffer.from(hash, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch { return false; }
}
const okCode = (c) => /^\d{4}$/.test(String(c));
const okPin = (p) => /^\d{4,6}$/.test(String(p));

app.post("/api/tour/create", wrap(async (req, res) => {
  const { code, pin, meta } = req.body || {};
  if (!okCode(code) || !okPin(pin) || !meta || typeof meta.name !== "string" || typeof meta.guideName !== "string") {
    return res.status(400).json({ error: "bad request" });
  }
  if (!allow(`create:${req.ip}`, 40, 60 * 60 * 1000)) return res.status(429).json({ error: "too many" });
  if (creating.has(code)) return res.status(409).json({ error: "taken" });
  creating.add(code);
  try {
    if ((await store.get(`tour:${code}`)) != null || (await store.get(`tour:${code}:auth`)) != null) {
      return res.status(409).json({ error: "taken" });
    }
    const salt = crypto.randomBytes(16).toString("hex");
    await store.set(`tour:${code}:auth`, JSON.stringify({ salt, hash: hashPin(String(pin), salt) }));
    await store.set(`tour:${code}`, JSON.stringify({ name: meta.name.slice(0, 80), guideName: meta.guideName.slice(0, 60), createdAt: Date.now() }));
    res.json({ ok: true });
  } finally {
    creating.delete(code);
  }
}));

function pinGate(req, res) {
  const { code, pin } = req.body || {};
  if (!okCode(code) || !okPin(pin)) { res.status(400).json({ error: "bad request" }); return false; }
  if (!allow(`pin:${req.ip}:${code}`, 8, 15 * 60 * 1000) || !allow(`pin:${code}`, 40, 60 * 60 * 1000)) {
    res.status(429).json({ error: "too many attempts" });
    return false;
  }
  return true;
}

app.post("/api/tour/login", wrap(async (req, res) => {
  if (!pinGate(req, res)) return;
  const { code, pin } = req.body;
  if (!(await verifyPin(code, String(pin)))) return res.status(401).json({ error: "wrong code or PIN" });
  res.json({ ok: true });
}));

app.post("/api/tour/delete", wrap(async (req, res) => {
  if (!pinGate(req, res)) return;
  const { code, pin } = req.body;
  if (!(await verifyPin(code, String(pin)))) return res.status(401).json({ error: "wrong code or PIN" });
  const keys = await store.keys(`tour:${code}`);
  await store.delMany(keys);
  res.json({ ok: true, deleted: keys.length });
}));

/* ------------------------------------------------------- Anthropic AI proxy */
// The API key stays here on the server. Only people who send the code of a real tour
// can use it, and usage is rate limited so a leaked URL can't run up your bill.
app.post("/api/claude", wrap(async (req, res) => {
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: { message: "The server has no ANTHROPIC_API_KEY set." } });
  }
  const code = String(req.get("x-tour-code") || "");
  if (!okCode(code) || (await store.get(`tour:${code}`)) == null) {
    return res.status(403).json({ error: { message: "Unknown tour code." } });
  }
  if (!allow(`ai-ip:${req.ip}`, 30, 5 * 60 * 1000) || !allow(`ai-tour:${code}`, 400, 24 * 60 * 60 * 1000)) {
    return res.status(429).json({ error: { message: "Too many AI requests - please wait a few minutes." } });
  }

  const body = req.body || {};
  let messages = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
  messages = messages
    .filter((m) => m && typeof m.content === "string" && m.content.trim())
    .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content.slice(0, 4000) }));
  while (messages.length && messages[0].role === "assistant") messages.shift(); // API wants the first message from the user
  if (messages.length === 0) return res.status(400).json({ error: { message: "No message." } });

  const payload = {
    model: ANTHROPIC_MODEL,
    max_tokens: Math.min(Number(body.max_tokens) || 600, 800),
    system: String(body.system || "").slice(0, 8000),
    messages,
  };

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) console.error("Anthropic error:", response.status, JSON.stringify(data).slice(0, 300));
  res.status(response.status).json(data);
}));

app.listen(PORT, () => {
  console.log(`TourLink backend running at http://localhost:${PORT} (storage: ${store.kind}, model: ${ANTHROPIC_MODEL})`);
  if (!ANTHROPIC_API_KEY) console.warn("No ANTHROPIC_API_KEY set - AI Assistant and Translator will not work.");
  if (store.kind === "file") console.warn("Using TEMPORARY file storage. Set the UPSTASH_REDIS_* variables so tours survive restarts.");
});
