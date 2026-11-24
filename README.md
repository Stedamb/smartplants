# SmartPlants

**Green thumb, without lifting a finger.**

SmartPlants is a DIY system for automatic plant care. An ESP8266 board reads a soil moisture sensor and waters the plant when the soil gets too dry. It reports to a live dashboard, where anyone can watch the plant and the owner can water it or change its thresholds from anywhere.

**Live:** https://smart-plants.vercel.app · [Dashboard](https://smart-plants.vercel.app/dashboard) · [Demo with simulated data](https://smart-plants.vercel.app/dashboard/demo)

## How it works

```
ESP8266 ──HTTPS, every 30 s──▶ Supabase Edge Function (device-sync) ──▶ Postgres
   ▲                                   │                                  │
   └──── thresholds + "water now" ─────┘                                  │ realtime
                                                                          ▼
                                                          React dashboard (/dashboard)
```

- **The board decides when to water**, so the plant is cared for even without WiFi. The dashboard only changes its thresholds or asks for an extra watering.
- **The board has its own token.** It can post its own readings and collect its own commands, nothing else. It never holds a Supabase key.
- **Readings are public; controls are not.** Watering and thresholds need the owner's login, enforced by Row Level Security in Postgres.

## Repository

| Path | What it is |
| --- | --- |
| `src/` | Landing page (Italian and English) and the dashboard, React 19 + Vite + Tailwind CSS 4 |
| `src/dashboard/` | Dashboard UI, the Supabase data source and the mock data source |
| `supabase/migrations/` | Schema, Row Level Security and realtime setup |
| `supabase/functions/device-sync/` | The board's only endpoint |
| `firmware/` | ESP8266 firmware (PlatformIO), see [firmware/README.md](firmware/README.md) |

## Run it locally

```bash
npm install
npm run dev     # landing at /, dashboard at /dashboard, demo at /dashboard/demo
npm test        # unit tests (Vitest)
```

Without a `.env`, `/dashboard` falls back to simulated data, so everything works on a fresh clone.

## Connect a real board

1. **Create a Supabase project**, then link and push the schema:
   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```
2. **Create the owner account** in the Supabase dashboard (Authentication › Users › Add user). Public sign-up is off.
3. **Register the board.** Generate a token and keep it for the firmware:
   ```bash
   TOKEN=$(openssl rand -hex 32); echo "$TOKEN"
   echo -n "$TOKEN" | shasum -a 256 | cut -d' ' -f1   # the hash to store
   ```
   Then in the SQL editor:
   ```sql
   insert into devices (owner_id, name, token_hash)
   values ((select id from auth.users where email = 'you@example.com'), 'Basil', '<hash>');
   ```
4. **Deploy the function:** `supabase functions deploy device-sync` (JWT verification is off for it in `supabase/config.toml`, because the board authenticates with its token).
5. **Configure the site:** copy `.env.example` to `.env` (and set the same variables on Vercel) with the project URL and anon key.
6. **Flash the board** following [firmware/README.md](firmware/README.md).

## The hardware

| Build | What it does |
| --- | --- |
| Base | Irrigation driven by a soil moisture sensor |
| Custom | Moisture indicators, a buzzer and a screen |
| Irrigation only | Board, sensor and water pump, for any plant |

Every build starts from the same core: an ESP8266 board, a soil moisture sensor and a small water pump.

## Not there yet

- The landing's contact form shows the form but does not send messages.
- No notifications, and one owner per project.
