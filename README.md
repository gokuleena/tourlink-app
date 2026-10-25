# TourLink

Group-tour app: chat, itinerary, live GPS map, attendance checkpoints, SOS, AI assistant and translator.
React + Vite frontend, small Express backend.

## Run on your computer
```bash
npm install
copy .env.example .env     # Windows   (Mac/Linux: cp .env.example .env)
# open .env and paste your ANTHROPIC_API_KEY
npm run dev
```
Open http://localhost:5173 . Location works on `localhost` and on any `https://` site (not on plain http addresses).

## Joining codes
The guide creates a tour and gets a 4-digit code. Members join with that code.
Anyone who knows a code can join, so share it only with your group.

## Calendar and trip details
The guide sets the trip start/end dates and an optional local emergency number (Plan tab -> Trip details). Every stop has a real date and time, picked from a calendar with month and year selectors.

## Live location
Each phone shares its real GPS position while TourLink is open on screen. Browsers pause location when the screen
locks or the app is in the background, so pins stop moving and show "last seen" after 5 minutes.

## Permanent storage (recommended once hosted)
Free hosting erases the server's temporary file when it restarts or sleeps. To keep tours:
1. Create a free Redis database at upstash.com
2. Copy its REST URL and REST Token
3. On Render -> your service -> Environment, add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
4. Check `https://YOUR-BACKEND/api/health` shows `"storage":"redis"`

## Deploying updates
`git add .` -> `git commit -m "message"` -> `git push`. Vercel (frontend) and Render (backend) redeploy automatically.

## Structure
```
server/index.js     storage API (file or Redis), AI proxy with rate limiting
src/App.jsx         the whole app
src/lib/storage.js  talks to the server
```
