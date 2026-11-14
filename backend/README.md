# DogalXalis API (Presentation Edition)

A small independent REST API for DogalXalis Mobile: Express + TypeScript + Zod, data saved in one JSON file.
It does not depend on the DogalXalis website. The mobile app works without it (offline); the API only adds a copy of the data.

## Run it (Windows PowerShell)

```powershell
cd backend
npm install
npm run dev          # development, restarts on changes
# or: npm run build; npm start
```

The server prints the addresses your phone can use, for example:

```
DogalXalis API listening on port 3000
Use one of these addresses as EXPO_PUBLIC_API_URL on the phone (same Wi-Fi):
  http://192.168.1.20:3000
```

Settings (environment variables, all optional): `PORT` (default 3000), `DATA_FILE` (default `data/db.json`).

## Connect the phone

1. PC and phone on the same Wi-Fi.
2. Allow the port in Windows Firewall (PowerShell **as Administrator**, once):
   ```powershell
   New-NetFirewallRule -DisplayName "DogalXalis API" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Private
   ```
3. Test from the phone's browser: open `http://<PC-address>:3000/health`. You should see `{"data":{"status":"ok"}}`.
4. In the project root, copy `.env.example` to `.env`, set `EXPO_PUBLIC_API_URL=http://<PC-address>:3000`,
   then restart Expo with `npx expo start -c`.

`localhost` on the phone is the phone itself, so never use it. Plain `http://` works in Expo Go;
a standalone Android build would need cleartext traffic enabled (see `docs/API_SPECIFICATION.md`).

## Endpoints

| Method and path | Success | Errors |
|---|---|---|
| `GET /health` | 200 | |
| `GET /categories` | 200 | |
| `POST /categories` | 201 (200 if the id already exists) | 400, 409 |
| `PUT /categories/:id` | 200 | 400, 404, 409 |
| `GET /transactions`, `GET /transactions/:id` | 200 | 404 |
| `POST /transactions` | 201 (200 if the id already exists) | 400 |
| `PUT /transactions/:id` | 200 | 400, 404 |
| `DELETE /transactions/:id` | 204 | 404 |
| `GET /budgets`, `GET /budgets/:id` | 200 | 404 |
| `POST /budgets` | 201 (200 if the id already exists) | 400, 409 |
| `PUT /budgets/:id` | 200 | 400, 404, 409 |
| `DELETE /budgets/:id` | 204 | 404 |

Success: `{ "data": ... }`. Error: `{ "error": { "code": "...", "message": "...", "details": [...] } }`.
Details, rules and examples: `docs/API_SPECIFICATION.md`.

## Structure

`src/routes` (URLs) -> `src/controllers` (read the request, validate with Zod) -> `src/services` (business rules)
-> `src/repositories/store.ts` (memory + JSON file). `src/middleware` holds the error handler and the request log.

## Tests

```powershell
npm test             # 20 tests against a real server on a free port
npm run typecheck
```

## Limits (by design, for this edition)

No authentication (anyone on the network can use it), one JSON file instead of a database, no pagination,
no per-user data. Do not expose it to the internet.
