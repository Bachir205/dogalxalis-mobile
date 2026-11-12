# Roadmap

Legend: Done (verified) / Provided (code supplied, not yet run on a device) / Planned.

| Phase | Scope | Status |
|---|---|---|
| 0 | Requirements and architecture | Done (design approved 2026-11-10) |
| 1 | Expo SDK 58 foundation, theme tokens, i18n skeleton, UI basics, app shell | Done (confirmed working in Expo Go by the developer) |
| 2 | Drawer + Tabs + Stack navigation, all shells | Done (running in Expo Go; automated tests pass) |
| 3 | Contexts (Theme, Preferences, Transactions, Budgets), Light/Dark/System, FR/EN switch, persistence | Provided and accepted (developer moved on to Phase 4); manual checklist T1 to T6 not reported |
| 4 | SQLite, categories CRUD, transactions CRUD, search and filters, money utilities, dashboard | Provided: 105 automated tests pass in a sandbox, device test pending |
| 5 | Monthly budgets and calculations | Planned |
| 6 | Express API, sync, offline retry | Planned |
| 7 | Final integration, empty/loading/error states, demo data button | Planned |
| 8 | Tests, README, screenshots, GitHub | Planned |

Out of scope for this edition: savings goals, recurring transactions, OCR, multi-account, bank sync,
forecasting, AI recommendations, advanced analytics.
