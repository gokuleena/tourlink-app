import express from "express";
import cors from "cors";
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
const TTL_SECONDS = 60 * 60 * 24 * 30; // tours expire 30 days after their last write (Redis only)

/* ------------------------------------------------------------------ storage */
// Two interchangeable stores:
//  - file  : a JSON file next to this script. Fine on your own computer, but a free
//            hosting plan erases it when the server restarts or goes to sleep.
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
    async byPrefix(prefix) {
      return Object.keys(data).filter((k) => k.startsWith(prefix)).map((k) => ({ key: k, value: data[k] }));
    },
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
    async byPrefix(prefix) {
      const keys = await cmd(["KEYS", `${prefix}*`]);
      if (!keys || keys.length === 0) return [];
      const vals = await cmd(["MGET", ...keys]);
      return keys.map((k, i) => ({ key: k, value: vals[i] })).filter((x) => x.value != null);
    },
  };
}

const store = UPSTASH_URL && UPSTASH_TOKEN ? makeRedisStore() : makeFileStore();

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

app.get("/api/health", (req, res) => {
  res.json({ ok: true, storage: store.kind, ai: Boolean(ANTHROPIC_API_KEY) });
});

app.get("/api/storage/:key", wrap(async (req, res) => {
  const key = req.params.key;
  if (!KEY_RE.test(key)) return res.status(400).json({ error: "bad key" });
  const value = await store.get(key);
  if (value == null) return res.status(404).json({ error: "not found" });
  res.json({ key, value, shared: true });
}));

app.post("/api/storage", wrap(async (req, res) => {
  const { key, value } = req.body || {};
  if (typeof key !== "string" || !KEY_RE.test(key)) return res.status(400).json({ error: "bad key" });
  if (typeof value !== "string" || value.length > MAX_VALUE_CHARS) return res.status(400).json({ error: "bad value" });
  await store.set(key, value);
  res.json({ key, value, shared: true });
}));

app.delete("/api/storage/:key", wrap(async (req, res) => {
  const key = req.params.key;
  if (!KEY_RE.test(key)) return res.status(400).json({ error: "bad key" });
  await store.del(key);
  res.json({ key, deleted: true, shared: true });
}));

// Read every row under one tour's prefix, e.g. all live locations:  tour:4721:loc:
app.get("/api/storage-prefix", wrap(async (req, res) => {
  const prefix = String(req.query.prefix || "");
  if (!PREFIX_RE.test(prefix)) return res.status(400).json({ error: "bad prefix" });
  res.json({ prefix, items: await store.byPrefix(prefix) });
}));

/* ------------------------------------------------------- Anthropic AI proxy */
// The API key stays here on the server. Only people who send the code of a real tour
// can use it, and usage is rate limited so a leaked URL can't run up your bill.
const ipHits = new Map();
const tourHits = new Map();
function allow(map, id, limit, windowMs) {
  const now = Date.now();
  const arr = (map.get(id) || []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) { map.set(id, arr); return false; }
  arr.push(now);
  map.set(id, arr);
  return true;
}

app.post("/api/claude", wrap(async (req, res) => {
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: { message: "The server has no ANTHROPIC_API_KEY set." } });
  }
  const code = String(req.get("x-tour-code") || "");
  if (!/^\d{4}$/.test(code) || (await store.get(`tour:${code}`)) == null) {
    return res.status(403).json({ error: { message: "Unknown tour code." } });
  }
  if (!allow(ipHits, req.ip, 30, 5 * 60 * 1000) || !allow(tourHits, code, 400, 24 * 60 * 60 * 1000)) {
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
  if (store.kind === "file") console.warn("Using temporary file storage. Set the UPSTASH_REDIS_* variables for permanent storage when hosted.");
});
