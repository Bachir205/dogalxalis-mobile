# API specification (independent Express backend)

Status: **designed, not implemented** (Phase 6). No university API exists, so the project builds its own.
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

## Physical-device networking

`localhost` on the phone is the phone itself. During development use the PC's LAN IP on the same Wi-Fi
and allow the port in Windows Firewall. Plain `http://` is expected to work in Expo Go; this is
verified on the real device in Phase 6. Hosting decision (D7) is deferred to Phase 6.
