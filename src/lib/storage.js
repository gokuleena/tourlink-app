// Drop-in replacement for the Claude-artifact "window.storage" API.
// shared=false -> browser localStorage (this device only)
// shared=true  -> the local Express server (server/index.js), so multiple
//                 devices/tabs pointed at the same server can see the same data.

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

async function list(prefix = "", shared = false) {
  if (!shared) {
    const keys = Object.keys(localStorage)
      .filter((k) => k.startsWith(`tl:${prefix}`))
      .map((k) => k.slice(3));
    return { keys, prefix, shared: false };
  }
  const res = await fetch(`${API_BASE}/api/storage?prefix=${encodeURIComponent(prefix)}`);
  if (!res.ok) throw new Error(`storage list failed: ${res.status}`);
  return res.json();
}

export const storage = { get, set, delete: del, list };
