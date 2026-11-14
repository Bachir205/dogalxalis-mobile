# API specification (independent Express backend)

Status: **implemented in Phase 6** (`backend/`, 20 tests; client in `src/services/api.ts`). No university API exists, so the project builds its own.
The base URL is never hard-coded: the app reads `EXPO_PUBLIC_API_URL` (see `.env.example`, added in Phase 6).

## Conventions

- JSON, camelCase. Success: `{ "data": ... }`. Error: `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [] } }`.
- The client translates by `code`; server messages are English and not shown to users.
- Validation uses Zod on the server (schemas duplicated from the app; no monorepo).
- Storage: JSON file (no native dependency on Windows). The server listens on `0.0.0.0`.

## Resources

```json
// Category
{ "id": "cat_food", "name": "Food", "type": "expense", "icon": "utensils", "color": "#E67E22" }
// Transaction
{ "id": "uuid", "title": "Lunch", "amountMinor": 2500, "currency": "XOF", "type": "expense",
  "categoryId": "cat_food", "description": null, "date": "2026-11-10",
  "createdAt": "...", "updatedAt": "..." }
// Budget
{ "id": "uuid", "categoryId": "cat_food", "amountMinor": 100000, "currency": "XOF",
  "month": "2026-11", "createdAt": "...", "updatedAt": "..." }
```

## Endpoints

| Method and path | Success | Errors |
|---|---|---|
| `GET /categories` | 200 list | |
| `POST /categories` | 201 (200 if same id exists) | 400, 409 duplicate name for the type |
| `PUT /categories/:id` | 200 | 400, 404, 409 |
| `GET /transactions` | 200 list | |
| `GET /transactions/:id` | 200 | 404 |
| `POST /transactions` (client-generated `id`) | 201 (200 if same id exists) | 400 (unknown category, type mismatch) |
| `PUT /transactions/:id` (full replace) | 200 | 400, 404 |
| `DELETE /transactions/:id` | 204 | 404 (client treats as success) |
| `GET /budgets`, `GET /budgets/:id` | 200 | 404 |
| `POST /budgets` | 201 (200 if same id exists) | 400, 409 duplicate (category, month, currency) |
| `PUT /budgets/:id` | 200 | 400, 404, 409 |
| `DELETE /budgets/:id` | 204 | 404 (client treats as success) |

No category `DELETE` in v1 (see `DATABASE_SCHEMA.md`).

## Rules enforced by the server

- Bodies are validated with Zod and unknown fields are refused (the app never sends its local `syncStatus`).
- Transaction: category must exist and have the transaction's type (`CATEGORY_NOT_FOUND`, `CATEGORY_TYPE_MISMATCH`, 400);
  amount is a positive integer of minor units (at most 10^12); `date` is a real calendar date.
- Budget: expense category only; one budget per category + month + currency (`DUPLICATE`, 409, also on PUT).
- Category: name unique per type, any case (`DUPLICATE`, 409); the type never changes (`TYPE_IMMUTABLE`, 400).
- `POST` is idempotent: sending an id that already exists returns the stored record with 200 and changes nothing,
  so a retry after a lost answer never duplicates. `PUT` replaces the record (404 if it does not exist).
  `DELETE` answers 404 when the record is already gone (the app treats that as success).
- Other errors: `ID_MISMATCH` (body id differs from the URL, 400), `INVALID_JSON` (400), `PAYLOAD_TOO_LARGE` (413),
  `NOT_FOUND` for unknown routes (404), `INTERNAL` (500). Every error has the same JSON shape.

## How the app uses it

See `ARCHITECTURE.md` (local-first synchronization). Short version: SQLite is the source of truth; local changes are
sent with `PUT` (or `POST` if the server answers 404), deletions with `DELETE`, then the server data is pulled and merged.

## Physical-device networking

`localhost` on the phone is the phone itself. During development use the PC's LAN IP on the same Wi-Fi
and allow the port in Windows Firewall (see `backend/README.md`). The address is read from `EXPO_PUBLIC_API_URL`
(`.env`, never written in the code); with no value the app works offline only.

Android blocks plain `http://` in built apps (API 28+) unless cleartext traffic is enabled
(`expo-build-properties`, `android.usesCleartextTraffic: true`). Developers report that plain `http://` works inside
Expo Go; this has to be confirmed on the real phone (manual checklist S1). A standalone APK or a development build
would need that setting, or an `https://` hosting. Hosting (decision D7) is not needed for the presentation if the
demo runs on the local network.
