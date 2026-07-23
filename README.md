# TourLink

A standalone version of the TourLink group-tour app: React + Vite frontend, tiny Express backend.

## Why this exists

The version you saw in Claude only runs inside Claude's own sandbox — it depends on
`window.storage` (a Claude-only save/load API) and calls Anthropic's API directly in a way
that only works because Claude's sandbox injects the key for you. This project replaces both
with real equivalents so it runs in a normal browser:

- **Storage**: `src/lib/storage.js` swaps in `localStorage` for personal data, and calls the
  local Express server for "shared" tour data (so two browser tabs/devices pointed at the same
  server can see the same tour).
- **AI Assistant / Translator**: the frontend now calls `http://localhost:3001/api/claude`,
  a tiny proxy in `server/index.js` that holds your Anthropic API key server-side and forwards
  the request. Your key never reaches the browser.

## Setup (in VS Code's terminal)

```bash
npm install
cp .env.example .env
```

Open `.env` and paste your Anthropic API key (get one at console.anthropic.com):

```
ANTHROPIC_API_KEY=sk-ant-...
```

## Run it

```bash
npm run dev
```

This starts both the Vite dev server (http://localhost:5173) and the Express backend
(http://localhost:3001) together. Open http://localhost:5173 in your browser.

If you'd rather run them in two separate terminals (useful for watching backend logs):

```bash
npm run dev:client   # terminal 1
npm run dev:server   # terminal 2
```

## Testing the multi-device sync

Shared tour data (members, chat, attendance, SOS, etc.) is stored server-side in
`server/data.json`, which is created automatically. Open the app in two browser tabs — join the
same tour code as a guide in one and a member in the other — and you'll see them sync every few
seconds, the same as the two-tab test you ran in Claude.

Note: since the backend only listens on `localhost`, this sync only works across tabs/browsers
on the *same computer*. To test across two different phones/laptops on your WiFi, you'd swap
`http://localhost:3001` in `src/lib/storage.js` and the two `fetch` calls in `src/App.jsx` for
your computer's LAN IP (e.g. `http://192.168.1.23:3001`), and make sure your firewall allows
the connection.

## Building for real deployment

```bash
npm run build
```

This produces a static `dist/` folder for the frontend. You'll still need to host `server/index.js`
somewhere (Render, Railway, Fly.io, a VPS, etc.) with your `ANTHROPIC_API_KEY` set as an environment
variable — never ship the key inside the frontend bundle. Swap the hardcoded
`http://localhost:3001` in `src/lib/storage.js` and `src/App.jsx` for your deployed backend's URL.

## Project structure

```
tourlink-app/
├── index.html
├── package.json
├── vite.config.js
├── .env.example
├── server/
│   └── index.js        # Express: file-backed storage API + Anthropic proxy
└── src/
    ├── main.jsx         # React entry point
    ├── App.jsx           # The whole TourLink app
    └── lib/
        └── storage.js    # Replaces window.storage
```
