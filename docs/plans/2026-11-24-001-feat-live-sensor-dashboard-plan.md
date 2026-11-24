---
title: SmartPlants Live Sensor Dashboard - Plan
type: feat
date: 2026-11-24
artifact_contract: ce-unified-plan/v1
product_contract_source: ce-plan-bootstrap
execution: code
---

# SmartPlants Live Sensor Dashboard - Plan

## Goal Capsule

- **Objective:** Anyone visiting the SmartPlants site can see the real plant's soil moisture live and its recent history, and Stefano can water it and change its thresholds from anywhere, while the plant keeps being watered automatically even when the internet or the backend is down.
- **Means:** ESP8266 firmware posts readings over HTTPS to a Supabase Edge Function; a React + Vite dashboard reads them with Supabase Realtime (KTD1, KTD2, KTD4).
- **Authority:** this plan, then the existing firmware in the private `Stedamb/SmartPlantsDashboard` repo for hardware behavior, then repo conventions.
- **Execution profile:** frontend and backend code can be fully built and verified locally with mock data; the live path needs a Supabase project and the physical board, which only Stefano can provide.
- **Stop conditions:** stop and report if a step would put a secret (WiFi password, service-role key, device token) in the repository, or if Supabase setup requires account access the agent does not have.
- **Who finishes:** the agent builds and verifies everything that runs locally; Stefano creates the Supabase project, deploys the function, flashes the board and runs the dev server.

---

## Product Contract

### Summary

SmartPlants is a DIY plant-care system. Today the website is only a landing page, while the working firmware and a prototype dashboard sit in a private repo and talk to Grandeur, a third-party IoT cloud. This plan moves everything into the public `smartplants` repo, replaces Grandeur with Supabase, and adds a live dashboard with a mock-data demo.

### Problem Frame

The system works on the bench but nobody can see it: the dashboard is private, Grandeur credentials are hardcoded, and the public site shows template leftovers. Recruiters and visitors should be able to open the site and see a real plant reporting in, and the owner should control it remotely, without making the plant depend on the cloud to stay alive.

### Requirements

**Device and firmware**
- R1. The firmware runs on the existing ESP8266 wiring (sensor on A0, pump on D8, red/yellow/green LEDs on D3/D2/D1, status LED on GPIO2) and keeps today's local behavior: traffic-light LEDs by dryness and pulsed pumping when the soil is dry.
- R2. Automatic watering is decided on the board and works without WiFi or backend.
- R3. The board sends a reading (raw value, moisture %, pump state, optional temperature and light) to the backend on a fixed interval.
- R4. The board applies thresholds and one-off "water now" commands received from the backend.
- R5. No secret (WiFi password, device token) is committed; the repo ships an example secrets file.

**Backend and security**
- R6. Grandeur is no longer used anywhere.
- R7. A device can only append its own readings and read its own pending commands and settings; a leaked device token grants nothing else.
- R8. Readings and device status are publicly readable; commands and settings changes require the owner's login.
- R9. Reading timestamps come from the server, not the board's uptime.

**Dashboard**
- R10. `/dashboard` shows current moisture, pump state, last-seen time and an online/offline badge, updated live.
- R11. `/dashboard` shows a history chart of recent readings.
- R12. When logged in, the owner can trigger "water now" and edit the dry and warning thresholds.
- R13. A mock-data version of the dashboard works with no backend: at `/dashboard/demo`, and as the automatic fallback when Supabase env vars are missing.
- R14. When the board is offline the live dashboard shows the last readings marked offline, never fabricated data.

**Landing and maintenance**
- R15. The landing keeps its look and copy but runs on current React, Vite, Tailwind and React Router, clearing the known dependency vulnerabilities.
- R16. Template leftovers on the landing are removed or replaced (lorem ipsum footer, hoobank links, project links pointing to unrelated sites), and the landing links to the dashboard.

### Success Criteria

- `npm audit --omit=dev` reports no high or critical vulnerabilities.
- `/dashboard/demo` renders live-updating mock data on a fresh clone with no `.env`.
- With a Supabase project configured, a reading posted with a valid device token appears on `/dashboard` without reload; a request with a wrong token is rejected.

### Scope Boundaries

- Deferred for later: notifications (email/push), multiple users, Bluetooth, mobile app, other boards (ESP32), persisting thresholds in board flash, OTA firmware updates.
- Outside this product's identity: generic IoT platform features (device provisioning UI, fleets).
- The private `SmartPlantsDashboard` repo is archived after this lands; its Astro code is not ported.

### Dependencies

- A Supabase project (Stefano's account) and the Supabase CLI (installed locally).
- PlatformIO to compile the firmware (not installed; verification falls back to Stefano's toolchain).

---

## Planning Contract

### Key Technical Decisions

- KTD1. **ESP posts over HTTPS to Supabase** (session-settled: user-directed — chosen over an MQTT broker and a local-network-only setup: no extra service to run, and Stefano already uses Supabase).
- KTD2. **One Edge Function, `device-sync`, is the device's only door.** The board sends its reading with an `x-device-token` header; the function checks the token against a SHA-256 hash in `devices`, inserts the reading with the server time, and returns the current thresholds plus any pending commands, marking them delivered. One round trip per interval covers R3, R4 and R9, and the board never holds the anon or service key (R7). The function is deployed with JWT verification off because it authenticates the device itself.
- KTD3. **Thresholds are stored as moisture percentages.** The current firmware uses raw values 500 (dry) and 350 (warning) with the mapping 600→0% and 200→100%; these become 25% and 62% defaults. The board converts, so the dashboard and the database speak one unit.
- KTD4. **Stay on React + Vite and add routes** (session-settled: user-directed — chosen over Astro and Next.js: the landing is good as it is and the change stays smallest).
- KTD5. **ESP8266 with firmware in `firmware/` as a PlatformIO project** (session-settled: user-directed — chosen over ESP32 and an out-of-repo firmware). Secrets live in `firmware/include/secrets.h`, gitignored, with `secrets.example.h` committed. TLS uses BearSSL with reduced buffers; certificate pinning is deferred and `setInsecure()` is acceptable only because the payload is non-sensitive and the token only grants R7's narrow rights — called out in the firmware README.
- KTD6. **Public readings, owner-only controls** (session-settled: user-directed — chosen over login-only and fully public). Row Level Security: `readings` and a `device_status` view are selectable by `anon`; `devices` settings updates and `commands` inserts require `auth.uid()` to equal the device's `owner_id`. `token_hash` is never exposed through the public view. Sign-ups are disabled in the Supabase project.
- KTD7. **A `DashboardSource` interface with two implementations**, `supabaseSource` and `mockSource`. The mock generates a plausible drying-and-watering curve, simulates pump pulses and responds to "water now", so the demo exercises the same UI. The source is chosen by route (`/dashboard/demo` is always mock) and by the presence of `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- KTD8. **Offline is derived, not stored:** a device is offline when its last reading is older than three sync intervals.

### High-Level Technical Design

Directional, not an implementation spec:

```
ESP8266 --POST /functions/v1/device-sync (x-device-token, reading)--> Edge Function
Edge Function --insert--> readings        (server timestamp)
Edge Function --select--> devices         (thresholds)
Edge Function --update--> commands        (delivered_at)
Edge Function <--{thresholds, commands}-- response to ESP8266

Dashboard --select + realtime--> readings, device_status (anon)
Dashboard (owner session) --insert--> commands; --update--> devices thresholds
```

Tables: `devices` (id, owner_id, name, token_hash, dry_threshold_pct, warning_threshold_pct, sync_interval_s, created_at); `readings` (id, device_id, created_at, raw, moisture_pct, pump_on, temperature_c, light_lux); `commands` (id, device_id, kind = 'water', duration_ms, created_at, delivered_at).

### Sequencing

U1 (dependency upgrade) first because every later unit builds on the new stack. U2 (schema) and U3 (function) next; U4 (data layer with mock) can proceed in parallel with U2-U3 since the mock needs no backend. U5 (dashboard UI) needs U4. U6 (firmware) needs U3's contract. U7 (docs, cleanup) last.

---

## Implementation Units

### U1. Upgrade the landing stack

- **Goal:** current React 19, Vite, Tailwind 4 (`@tailwindcss/vite`), React Router, `motion` in place of `framer-motion`; landing looks the same; template leftovers fixed; Vitest added.
- **Requirements:** R15, R16
- **Files:** `package.json`, `vite.config.ts`, `src/index.css`, `tailwind.config.js` (removed after migrating theme tokens to CSS), `postcss.config.js` (removed), `src/App.tsx`, `src/components/*.jsx`, `src/constants/index.js`, `src/i18n.ts`, `.eslintrc.cjs` (replaced by flat config or removed if unused)
- **Approach:** migrate Tailwind theme extensions to `@theme` in CSS; keep class names; swap imports `framer-motion` → `motion/react`; remove unused `emailjs` (the contact form's sending code is already commented out); replace lorem ipsum footer and hoobank links with real links; fix project links; add a Dashboard link in the navbar.
- **Test scenarios:** build succeeds; `npm audit --omit=dev` has no high/critical; visual check of landing is Stefano's (he runs the dev server).
- **Verification:** `npm run build`, `npm audit --omit=dev`.

### U2. Supabase schema and security

- **Goal:** tables, view, RLS policies and realtime publication, plus a seed for one demo device.
- **Requirements:** R7, R8, R9
- **Files:** `supabase/config.toml`, `supabase/migrations/20261124000000_smartplants.sql`, `supabase/seed.sql`
- **Approach:** per KTD6; `readings.created_at default now()`; `device_status` view joins the latest reading and exposes no `token_hash`; add `readings` to the `supabase_realtime` publication; index `readings (device_id, created_at desc)`.
- **Test scenarios:** anon can select readings and `device_status`; anon cannot select `devices.token_hash`, insert readings or insert commands; an authenticated non-owner cannot insert commands; the owner can insert commands and update thresholds. (Verified against a local Supabase stack when Docker is available; otherwise reviewed by reading the SQL.)
- **Verification:** `supabase db lint` if a local stack is available.

### U3. `device-sync` Edge Function

- **Goal:** the device's single endpoint per KTD2.
- **Requirements:** R3, R4, R7, R9
- **Files:** `supabase/functions/device-sync/index.ts`, `supabase/functions/_shared/sync.ts` (pure validation and shaping, no Deno APIs), `src/lib/__tests__/sync.test.ts`
- **Approach:** validate payload (moisture 0-100, raw 0-1024, optional numbers); hash token with SHA-256 via Web Crypto; constant-time compare; service-role client from env inside the function only; return `{thresholds, commands}`.
- **Test scenarios:** valid payload accepted and shaped; out-of-range and missing fields rejected; missing token → 401; unknown token → 401; commands returned once and then marked delivered (logic level).
- **Verification:** `npx vitest run`.

### U4. Dashboard data layer and mock source

- **Goal:** `DashboardSource` interface, Supabase implementation, mock implementation.
- **Requirements:** R10, R11, R12, R13, R14
- **Files:** `src/dashboard/source.ts`, `src/dashboard/supabaseSource.ts`, `src/dashboard/mockSource.ts`, `src/dashboard/status.ts`, `src/dashboard/__tests__/mockSource.test.ts`, `src/dashboard/__tests__/status.test.ts`, `.env.example`
- **Approach:** per KTD7 and KTD8; mock uses a seeded generator so tests are deterministic; mock "water now" raises moisture over the next ticks.
- **Test scenarios:** mock history has the requested length and values in 0-100; mock moisture decreases over time without watering and rises after a water command; mock triggers automatic pumping below the dry threshold; offline when last reading older than three intervals, online otherwise; source selection falls back to mock without env vars.
- **Verification:** `npx vitest run`.

### U5. Dashboard UI

- **Goal:** `/dashboard` and `/dashboard/demo` pages in the landing's visual language.
- **Requirements:** R10, R11, R12, R13, R14
- **Files:** `src/dashboard/DashboardPage.tsx`, `src/dashboard/components/*.tsx`, `src/App.tsx` (routes), `src/i18n.ts` (dashboard strings, it + en)
- **Approach:** moisture gauge, pump and online badges, last-seen time, recharts line chart of history with threshold reference lines; owner panel shown only with a session (email + password sign-in); demo banner on the mock route.
- **Test scenarios:** covered by U4 logic tests; UI checked by Stefano in the browser.
- **Verification:** `npm run build`.

### U6. ESP8266 firmware

- **Goal:** port the existing sketch to PlatformIO, drop Grandeur, add `device-sync`.
- **Requirements:** R1, R2, R3, R4, R5, R6
- **Files:** `firmware/platformio.ini`, `firmware/src/main.cpp`, `firmware/include/pins.h`, `firmware/include/secrets.example.h`, `firmware/README.md`, `.gitignore`
- **Approach:** keep the non-blocking `millis()` loop, LED logic and pump pulse timing; thresholds in percent with KTD3 defaults; sync every 30 s with ArduinoJson; apply returned thresholds; run "water now" as a single pump run of `duration_ms`, capped for safety; WiFi reconnect without blocking local control.
- **Test scenarios:** compile with `pio run` when PlatformIO is available; manual bench test by Stefano (dry sensor → red LED and pump pulses; "water now" from dashboard runs the pump once).
- **Verification:** `pio run -d firmware` if available.

### U7. Docs and cleanup

- **Goal:** README reflects the new system; setup steps for Supabase and firmware; old repo archival noted.
- **Requirements:** R5, R6
- **Files:** `README.md`, `firmware/README.md`
- **Approach:** architecture sketch, setup (create project, run migration, set owner, create device token, deploy function, set env vars), mock demo instructions; correct the README's EmailJS claim.
- **Verification:** links and commands reviewed.

---

## Verification Contract

| Gate | Command | Applies to |
| --- | --- | --- |
| Unit tests | `npx vitest run` | U3, U4 |
| Build and type check | `npm run build` | U1, U5 |
| Dependency audit | `npm audit --omit=dev` | U1 |
| Firmware compile | `pio run -d firmware` (when available) | U6 |
| Secret scan | `git grep -nE "grandeur|service_role|passphrase"` returns nothing sensitive | all |

## Definition of Done

- All gates above pass, or a gate that could not run is reported with the reason.
- No secrets in the diff; `firmware/include/secrets.h` and `.env` are gitignored.
- No Grandeur references remain.
- Dead code from abandoned attempts is removed.
- Stefano has a short list of the manual steps left: Supabase project, owner account, device token, function deploy, Vercel env vars, flashing the board.
