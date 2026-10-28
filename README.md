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

## Joining codes, guide PIN, deleting a tour
- The guide creates a tour, chooses a 4-6 digit **guide PIN**, and gets a 4-digit joining code. Members join with just the code.
- Anyone who knows the code can join, so share it only with your group.
- The guide signs back in on any phone with **Tour Guide -> Sign in to my tour** (code + PIN).
- When the tour is over: More -> **Tour** -> download a copy, then **Delete this tour** (needs the PIN). Everything is erased and everyone's app returns to the start screen.
- The PIN is stored only as a salted hash on the server and can't be read back. There is no PIN recovery.

## Calendar and trip details
The guide sets the trip start/end dates and an optional local emergency number (Plan tab -> Trip details). Every stop has a real date and time, picked from a calendar with month and year selectors.

## Offline and emergency features
- **Installable app.** Open TourLink once with internet, then "Add to Home screen". After that the app opens with no internet and shows the last saved tour data.
- **Chat and SOS never get lost.** Messages and SOS alerts written offline wait in an outbox on the phone and send automatically when the connection returns. The chat tab also offers "send by SMS instead".
- **Calling and texting use the phone signal.** Everyone can add a mobile number (Home -> Contacts). The SOS screen has "Call guide" and "Text guide: SOS + location" buttons. The guide can text the whole group.
- **Member finder works offline.** Distance and compass direction to everyone's last saved position, from your phone's own GPS. Map pictures are only available for areas viewed before (open the map around your hotel on Wi-Fi first).
- **Nearby places and the AI assistant need internet.** Map -> Find nearby places (hotels, hospitals, pharmacies, ATMs...) uses OpenStreetMap data and needs no credits. The AI assistant uses the same data as a tool and needs Anthropic credits on the server.

## Live location
Each phone shares its real GPS position while TourLink is open on screen. Browsers pause location when the screen
locks or the app is in the background, so pins stop moving and show "last seen" after 5 minutes.

## Permanent storage (required for real trips)
Without it, a free host erases every tour whenever the server restarts, redeploys or sleeps. To keep tours until the guide deletes them (or a year passes):
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
