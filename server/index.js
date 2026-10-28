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

/* ------------------------------------------------------- real nearby places (OpenStreetMap) */
// Free data from OpenStreetMap: no API key and no credits needed. Used by the Map -> Nearby search
// and by the AI assistant (as a tool), so hotel/hospital/etc. answers come from real data, not guesses.
const OVERPASS_URLS = process.env.OVERPASS_URL
  ? [process.env.OVERPASS_URL]
  : ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
const NOMINATIM_URL = process.env.NOMINATIM_URL || "https://nominatim.openstreetmap.org/search";
const UA = "TourLink/1.0 (group tour app; github.com/gokuleena/tourlink-app)";

const CATEGORIES = {
  hotel: [["tourism", "^(hotel|hostel|guest_house|motel|apartment)$"]],
  restaurant: [["amenity", "^(restaurant|fast_food|food_court)$"]],
  cafe: [["amenity", "^cafe$"]],
  hospital: [["amenity", "^(hospital|clinic|doctors)$"]],
  pharmacy: [["amenity", "^pharmacy$"]],
  police: [["amenity", "^police$"]],
  atm: [["amenity", "^(atm|bank)$"]],
  shop: [["shop", "^(convenience|supermarket|mall|department_store)$"]],
  toilets: [["amenity", "^toilets$"]],
  transport: [["railway", "^(station|subway_entrance)$"], ["highway", "^bus_stop$"], ["amenity", "^bus_station$"]],
  fuel: [["amenity", "^fuel$"]],
  embassy: [["amenity", "^embassy$"], ["office", "^diplomatic$"]],
};

async function fetchT(url, opts = {}, ms = 15000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try { return await fetch(url, { ...opts, signal: ctl.signal }); } finally { clearTimeout(t); }
}
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000, rad = (d) => (d * Math.PI) / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
async function geocode(q) {
  const r = await fetchT(`${NOMINATIM_URL}?q=${encodeURIComponent(q)}&format=json&limit=1`, { headers: { "User-Agent": UA, "Accept-Language": "en" } }, 10000);
  if (!r.ok) throw new Error(`geocode ${r.status}`);
  const arr = await r.json();
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return { lat: Number(arr[0].lat), lng: Number(arr[0].lon), label: String(arr[0].display_name || q).split(",").slice(0, 3).join(",").trim() };
}
function buildQuery(category, lat, lng, radius) {
  const parts = [];
  for (const [k, re] of CATEGORIES[category]) {
    for (const t of ["node", "way", "relation"]) parts.push(`${t}["${k}"~"${re}"](around:${radius},${lat},${lng});`);
  }
  return `[out:json][timeout:20];(${parts.join("")});out center 80;`;
}
function parsePlaces(json, category, lat, lng) {
  const out = [];
  const seen = new Set();
  for (const el of json.elements || []) {
    const t = el.tags || {};
    const la = el.lat ?? (el.center && el.center.lat);
    const lo = el.lon ?? (el.center && el.center.lon);
    if (la == null || lo == null) continue;
    const generic = ["atm", "toilets", "transport", "fuel"].includes(category);
    const name = t.name || t["name:en"] || (generic ? t.operator || t.brand || category : "");
    if (!name) continue;
    const key = `${name}|${la.toFixed(4)}|${lo.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const address = [t["addr:housenumber"], t["addr:street"], t["addr:suburb"] || t["addr:city"]].filter(Boolean).join(" ");
    out.push({
      name, type: t.tourism || t.amenity || t.shop || t.railway || t.highway || category,
      lat: la, lng: lo, distance: Math.round(haversine(lat, lng, la, lo)),
      address: address || undefined, phone: t.phone || t["contact:phone"] || undefined,
      website: t.website || t["contact:website"] || undefined,
    });
  }
  out.sort((a, b) => a.distance - b.distance);
  return out.slice(0, 12);
}
async function overpass(query) {
  let lastErr;
  for (const url of OVERPASS_URLS) {
    try {
      const r = await fetchT(url, { method: "POST", headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" }, body: "data=" + encodeURIComponent(query) }, 25000);
      if (!r.ok) { lastErr = new Error(`overpass ${r.status}`); continue; }
      return await r.json();
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("overpass failed");
}
const placeCache = new Map();
async function findPlaces({ category, lat, lng, radius }) {
  if (!CATEGORIES[category]) throw new Error("unknown category");
  const R = Math.min(Math.max(Number(radius) || 2000, 300), 8000);
  const key = `${category}:${lat.toFixed(3)}:${lng.toFixed(3)}:${R}`;
  const hit = placeCache.get(key);
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) return hit.results;
  const results = parsePlaces(await overpass(buildQuery(category, lat, lng, R)), category, lat, lng);
  placeCache.set(key, { at: Date.now(), results });
  if (placeCache.size > 200) placeCache.delete(placeCache.keys().next().value);
  return results;
}
// near = a place name/address, or "user"/empty to use the traveler's own position
async function resolveCenter(near, user) {
  const n = String(near || "").trim();
  if (!n || n === "user" || n === "me") {
    return user && Number.isFinite(user.lat) && Number.isFinite(user.lng) ? { lat: user.lat, lng: user.lng, label: "your location" } : null;
  }
  return await geocode(n.slice(0, 200));
}
async function tourCodeOk(req) {
  const code = String(req.get("x-tour-code") || "");
  return okCode(code) && (await store.get(`tour:${code}`)) != null ? code : null;
}

app.get("/api/places", wrap(async (req, res) => {
  const code = await tourCodeOk(req);
  if (!code) return res.status(403).json({ error: "Unknown tour code." });
  if (!allow(`places:${req.ip}`, 40, 10 * 60 * 1000)) return res.status(429).json({ error: "Too many searches - please wait a few minutes." });
  const category = String(req.query.category || "");
  if (!CATEGORIES[category]) return res.status(400).json({ error: "Unknown category." });
  let center;
  try {
    center = await resolveCenter(req.query.near, { lat: parseFloat(req.query.lat), lng: parseFloat(req.query.lng) });
  } catch (e) {
    return res.status(502).json({ error: "The place-name search is busy. Please try again in a minute." });
  }
  if (!center) {
    return res.status(String(req.query.near || "").trim() ? 404 : 400).json({ error: String(req.query.near || "").trim() ? "Couldn't find that place. Try adding the city, e.g. \"Hotel name, Manila\"." : "No location. Turn on location or type a place name." });
  }
  try {
    const results = await findPlaces({ category, lat: center.lat, lng: center.lng, radius: req.query.radius });
    res.json({ center, category, results });
  } catch (e) {
    console.error("places error", e.message);
    res.status(502).json({ error: "The places service is busy. Please try again in a minute." });
  }
}));

/* ------------------------------------------------------- Anthropic AI proxy */
// The API key stays here on the server. Only people who send the code of a real tour
// can use it, and usage is rate limited so a leaked URL can't run up your bill.
const ANTHROPIC_API_URL = process.env.ANTHROPIC_API_URL || "https://api.anthropic.com/v1/messages";
let workingModel = null;

async function callAnthropic(payload) {
  const candidates = [...new Set([workingModel, ANTHROPIC_MODEL, "claude-sonnet-5-5", "claude-haiku-5-5"].filter(Boolean))];
  let last = null;
  for (const model of candidates) {
    const r = await fetchT(ANTHROPIC_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ ...payload, model }),
    }, 60000);
    let data = {};
    try { data = await r.json(); } catch (e) { data = {}; }
    if (r.ok) { workingModel = model; return { status: r.status, data }; }
    last = { status: r.status, data };
    console.error("Anthropic error:", model, r.status, JSON.stringify(data).slice(0, 300));
    if (r.status === 404 && data && data.error && data.error.type === "not_found_error") continue; // model name not available: try the next one
    return last;
  }
  return last;
}

const PLACES_TOOL = {
  name: "find_places",
  description: "Find REAL nearby places from OpenStreetMap (hotels, restaurants, cafes, hospitals, pharmacies, police stations, ATMs/banks, shops, toilets, public transport, fuel, embassies) around a named place/address or around the traveler's current location. Use it whenever the traveler asks about places near somewhere.",
  input_schema: {
    type: "object",
    properties: {
      category: { type: "string", enum: Object.keys(CATEGORIES) },
      near: { type: "string", description: "A place name or address with its city, e.g. \"Philippine Women's University, Manila\". Use \"user\" for the traveler's current location." },
      radius_m: { type: "integer", description: "Search radius in metres (300-8000). Default 2000." },
    },
    required: ["category", "near"],
  },
};
const TOOL_HINT = "\n\nYou have a find_places tool backed by OpenStreetMap. For ANY question about places near somewhere (hotels, food, hospitals, pharmacies, ATMs, police, toilets, transport...), call it instead of guessing, then summarise the real results: name, distance, and a Maps link if useful. Never invent place names. If the tool returns nothing or an error, say so and suggest the Map tab's Nearby search or asking the guide.";

async function runTool(name, input, user) {
  if (name !== "find_places") return { error: "unknown tool" };
  try {
    const category = String((input && input.category) || "");
    if (!CATEGORIES[category]) return { error: "unknown category", allowed: Object.keys(CATEGORIES) };
    const near = input && input.near;
    const center = await resolveCenter(near, user);
    if (!center) {
      return { error: near && near !== "user" ? "Couldn't find that place name. Ask the traveler for the city or a nearby landmark." : "The traveler's location isn't available (location sharing is off). Ask them to turn on location or name a place." };
    }
    const results = await findPlaces({ category, lat: center.lat, lng: center.lng, radius: input && input.radius_m });
    return {
      searched_around: center.label, category, count: results.length,
      results: results.map((r) => ({ name: r.name, type: r.type, distance_m: r.distance, address: r.address, phone: r.phone, website: r.website, maps: `https://www.google.com/maps/search/?api=1&query=${r.lat},${r.lng}` })),
    };
  } catch (e) {
    return { error: "The places service is busy right now. Suggest trying again in a minute." };
  }
}

app.post("/api/claude", wrap(async (req, res) => {
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: { message: "The server has no ANTHROPIC_API_KEY set." } });
  }
  const code = await tourCodeOk(req);
  if (!code) return res.status(403).json({ error: { message: "Unknown tour code." } });
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

  const useTools = body.useTools === true;
  const user = body.userLocation && Number.isFinite(Number(body.userLocation.lat)) && Number.isFinite(Number(body.userLocation.lng))
    ? { lat: Number(body.userLocation.lat), lng: Number(body.userLocation.lng) } : null;
  const payload = {
    max_tokens: Math.min(Number(body.max_tokens) || 600, 900),
    system: String(body.system || "").slice(0, 8000) + (useTools ? TOOL_HINT : ""),
    messages,
    ...(useTools ? { tools: [PLACES_TOOL] } : {}),
  };

  let result = await callAnthropic(payload);
  for (let round = 0; useTools && round < 4 && result && result.status === 200 && result.data.stop_reason === "tool_use"; round++) {
    const uses = (result.data.content || []).filter((b) => b.type === "tool_use");
    const toolResults = [];
    for (const u of uses) {
      toolResults.push({ type: "tool_result", tool_use_id: u.id, content: JSON.stringify(await runTool(u.name, u.input, user)).slice(0, 12000) });
    }
    payload.messages = [...payload.messages, { role: "assistant", content: result.data.content }, { role: "user", content: toolResults }];
    result = await callAnthropic(payload);
  }
  res.status(result.status).json(result.data);
}));

app.listen(PORT, () => {
  console.log(`TourLink backend running at http://localhost:${PORT} (storage: ${store.kind}, model: ${ANTHROPIC_MODEL})`);
  if (!ANTHROPIC_API_KEY) console.warn("No ANTHROPIC_API_KEY set - AI Assistant and Translator will not work.");
  if (store.kind === "file") console.warn("Using TEMPORARY file storage. Set the UPSTASH_REDIS_* variables so tours survive restarts.");
});
