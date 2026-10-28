// Storage layer for TourLink.
// shared=false -> this browser's localStorage (personal settings, saved session)
// shared=true  -> the TourLink server, so every phone in the tour sees the same data.

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

async function get(key, shared = false) {
  if (!shared) {
    const raw = localStorage.getItem(`tl:${key}`);
    return raw ? { key, value: raw, shared: false } : null;
  }
  const res = await fetch(`${API_BASE}/api/storage/${encodeURIComponent(key)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`storage get failed: ${res.status}`);
  return res.json();
}

async function set(key, value, shared = false) {
  if (!shared) {
    localStorage.setItem(`tl:${key}`, value);
    return { key, value, shared: false };
  }
  const res = await fetch(`${API_BASE}/api/storage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) throw new Error(`storage set failed: ${res.status}`);
  return res.json();
}

async function del(key, shared = false) {
  if (!shared) {
    localStorage.removeItem(`tl:${key}`);
    return { key, deleted: true, shared: false };
  }
  const res = await fetch(`${API_BASE}/api/storage/${encodeURIComponent(key)}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`storage delete failed: ${res.status}`);
  return res.json();
}

// All shared rows whose key starts with `prefix` (e.g. "tour:4721:loc:"). Returns [{key, value}].
async function listValues(prefix) {
  const res = await fetch(`${API_BASE}/api/storage-prefix?prefix=${encodeURIComponent(prefix)}`);
  if (!res.ok) throw new Error(`storage list failed: ${res.status}`);
  const data = await res.json();
  return data.items || [];
}

async function health() {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) throw new Error("health failed");
  return res.json();
}

// POST a JSON body to a server endpoint; returns { ok, status, data } and never throws on HTTP errors.
async function post(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data = {};
  try { data = await res.json(); } catch (e) { /* no body */ }
  return { ok: res.ok, status: res.status, data };
}

// GET a JSON endpoint with optional headers; returns { ok, status, data } and never throws on HTTP errors.
async function getJson(path, headers = {}) {
  const res = await fetch(`${API_BASE}${path}`, { headers });
  let data = {};
  try { data = await res.json(); } catch (e) { data = {}; }
  return { ok: res.ok, status: res.status, data };
}

export const storage = { get, set, delete: del, listValues, health, post, getJson };
