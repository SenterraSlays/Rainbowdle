# Rainbowdle

A guess-the-operator game for Rainbow Six Siege, with singleplayer, online accounts, a global leaderboard, and room-based multiplayer.

## Features

- Singleplayer (Classic + Daily), fully playable offline/logged-out with localStorage stats
- Email/password accounts with unique usernames
- Online statistics and a global leaderboard
- Room-based multiplayer (2-8 players) with realtime lobbies, a shared mystery operator, and per-player guess progress

## Project structure

```
rainbowdle/
├── index.html
├── style.css
├── operators.js        existing operator roster (client-side reference data)
├── comparison.js        existing guess comparison logic
├── game.js               existing singleplayer game state
├── storage.js           existing localStorage persistence
├── quiz.js                existing learning-mode quiz
├── ui.js                    existing singleplayer UI
├── script.js             existing app bootstrap
├── js/
│   ├── supabase.js      Supabase client setup (put your project URL/key here)
│   ├── auth.js              sign up / log in / log out / username creation
│   ├── leaderboard.js  leaderboard fetching + singleplayer stat submission
│   ├── multiplayer.js  room create/join, realtime lobby, guess submission
│   └── online-ui.js       wires the modules above to the new modals in index.html
├── supabase/
│   └── schema.sql        run this once in the Supabase SQL editor
└── pngs/
```

Singleplayer is untouched — `operators.js`, `comparison.js`, `game.js`, `storage.js`, and `ui.js` work exactly as before, logged in or not.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free account if you don't have one.
2. Click **New project**. Pick any name, a database password (you will not need this password anywhere in the code), and a region close to your players.
3. Wait for the project to finish provisioning (a couple of minutes).

## 2. Run the database setup script

1. In your Supabase project, open the **SQL Editor** (left sidebar).
2. Click **New query**.
3. Open `supabase/schema.sql` from this repository, copy its entire contents, and paste it into the SQL editor.
4. Click **Run**.

This single script creates every table, index, Row Level Security policy, and function Rainbowdle needs, and seeds the `operators` table with the current roster. If it succeeds you'll see "Success. No rows returned."

This also enables Row Level Security on every user-facing table and adds `rooms` and `room_players` to the `supabase_realtime` publication so multiplayer lobbies update live.

## 3. Enable email/password authentication

1. In your Supabase project, go to **Authentication → Providers**.
2. Confirm **Email** is enabled (it is by default).
3. For local testing, go to **Authentication → Settings** and consider turning **Confirm email** off temporarily so you can sign up with a fake address without checking an inbox. Turn it back on before sharing the game publicly.

## 4. Get your API keys

1. Go to **Project Settings → API**.
2. Copy the **Project URL**.
3. Copy the **anon / public** key (sometimes labeled "publishable key"). This is the only key that ever goes in the frontend.

Do not copy the `service_role` key or your database password anywhere in this project. They must never appear in frontend code.

## 5. Configure Rainbowdle

Open `js/supabase.js` and replace the placeholders:

```js
const SUPABASE_URL = "https://your-project-ref.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "your-anon-public-key";
```

That's the only configuration step. If these are left as placeholders, the game still runs, but online features are disabled and singleplayer keeps working exactly as before.

## 6. Run Rainbowdle locally

Because the game makes `fetch` requests to Supabase, opening `index.html` directly from disk (`file://`) may be blocked by the browser. Serve it over a local HTTP server instead, for example:

```bash
cd rainbowdle
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## 7. Deploy to GitHub Pages

1. Push this project to a GitHub repository.
2. In the repository, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to "Deploy from a branch", pick your branch (e.g. `main`) and the root folder.
4. Save. GitHub will publish the site at `https://your-username.github.io/your-repo/`.

No server process, container, or continuously running backend is required — Supabase handles the database, auth, and realtime layer, and GitHub Pages serves static files.

## How the online features work

- **Accounts**: Supabase Auth handles email/password sign-up and login. After signing up, the player picks a username (3-20 characters, letters/numbers/underscores/hyphens, case-insensitive unique), which creates a row in `profiles` through the `create_profile` database function.
- **Leaderboard**: reads from a `leaderboard` view built on top of `profile_stats`, which is only ever written to by database functions (`record_singleplayer_result`, `mp_record_result`) — never directly by the client.
- **Multiplayer rooms**: `create_room` and `join_room` are database functions that pick a mystery operator server-side and manage room membership under Row Level Security. The mystery operator's name is stored in `rooms.mystery_operator_name`, a column no RLS policy ever exposes to players directly — the client never receives it until a player solves it or runs out of guesses.
- **Guess validation**: every multiplayer guess goes through `mp_submit_guess`, a `SECURITY DEFINER` Postgres function that looks up both operators server-side, computes the match/higher/lower/mismatch result, and returns only that comparison — the browser cannot submit a fabricated result or guess count.
- **Realtime**: the lobby and player list subscribe to Postgres changes on `rooms` and `room_players` via Supabase Realtime, so joins, leaves, host transfers, and game starts show up without refreshing.
- **Host handoff and reconnects**: `leave_room` transfers host to the next-longest-joined active player rather than closing the room, and rejoining an existing room (same account, same code) restores your seat and guess count rather than creating a duplicate entry.
- **Room cleanup**: `cleanup_stale_rooms()` marks rooms inactive for more than an hour as `closed`. This function isn't scheduled automatically — call it periodically (for example from a [Supabase scheduled Edge Function or pg_cron job](https://supabase.com/docs/guides/database/extensions/pg_cron), which you can add from the SQL editor once your project is set up) if you want automatic cleanup instead of manual housekeeping.

### A known limitation

Singleplayer has no server-side game state — the mystery operator is chosen and checked entirely in the browser, by design, since singleplayer must keep working offline and logged out. This means `record_singleplayer_result` trusts the authenticated caller's own claim of "won" and "guess count" for *singleplayer* games specifically. Multiplayer results are not subject to this limitation: they're derived entirely from server-tracked `room_players` rows that the client cannot write to directly. If you want singleplayer leaderboard entries to be tamper-proof too, the mystery operator selection and guess checking would need to move server-side (similar to how multiplayer works), which is a larger change than the current single-player-stays-local design calls for.

## Extending later

The schema was written to leave room for the features explicitly deferred in this version:

- **Daily multiplayer**: `rooms` doesn't yet have a "daily" mode, but `create_room` picking the mystery operator server-side means a daily variant can reuse the same function with a deterministic pick instead of `order by random()`.
- **Chat/emotes/reactions**: not implemented; `room_players`/`rooms` have no messaging columns yet, keeping multiplayer focused on the core game as intended.
- **Configurable player limits**: already supported — `create_room(p_max_players)` accepts 2-8 today; raising the ceiling is a one-line change to the check inside that function.
