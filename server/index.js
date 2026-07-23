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

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// ---------- tiny file-backed key/value store (stands in for window.storage's shared mode) ----------
function loadData() {
  if (!fs.existsSync(DATA_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return {};
  }
}
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.get("/api/storage", (req, res) => {
  const prefix = req.query.prefix || "";
  const data = loadData();
  const keys = Object.keys(data).filter((k) => k.startsWith(prefix));
  res.json({ keys, prefix });
});

app.get("/api/storage/:key", (req, res) => {
  const data = loadData();
  const key = decodeURIComponent(req.params.key);
  if (!(key in data)) return res.status(404).json({ error: "not found" });
  res.json({ key, value: data[key], shared: true });
});

app.post("/api/storage", (req, res) => {
  const { key, value } = req.body;
  if (!key) return res.status(400).json({ error: "key required" });
  const data = loadData();
  data[key] = value;
  saveData(data);
  res.json({ key, value, shared: true });
});

app.delete("/api/storage/:key", (req, res) => {
  const data = loadData();
  const key = decodeURIComponent(req.params.key);
  delete data[key];
  saveData(data);
  res.json({ key, deleted: true, shared: true });
});

// ---------- Anthropic proxy: keeps the API key server-side only ----------
app.post("/api/claude", async (req, res) => {
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: "Missing ANTHROPIC_API_KEY. Copy .env.example to .env and add your key from console.anthropic.com.",
    });
  }
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`TourLink backend running at http://localhost:${PORT}`);
  if (!ANTHROPIC_API_KEY) {
    console.warn("⚠️  No ANTHROPIC_API_KEY set — AI Assistant and Translator will not work until you add one to .env");
  }
});
