# Test plan

Legend: Automated-pass (ran in a sandbox) / Manual-pending (to run on the Android phone) / Planned.

## Navigation (Phase 2)

Automated (`npm test`, `tests/integration/navigation.test.tsx`, uses the real route files; the native drawer
animation is replaced by a stub in `tests/setup/drawerLayoutMock.tsx`):

| # | Case | Expected | Status |
|---|---|---|---|
| N1 | App opens | Path `/`, Home text visible | Automated-pass |
| N2 | Press the four tabs | Paths `/transactions`, `/budgets`, `/settings`, `/` | Automated-pass |
| N3 | Drawer: Categories, About, Dashboard | Paths `/categories`, `/about`, `/` | Automated-pass |
| N4 | Home floating button | Path `/transactions/new` | Automated-pass |
| N5 | Transactions sample, then Edit | Paths `/transactions/sample`, `/transactions/edit/sample`, param shown | Automated-pass |
| N6 | Budgets, Add budget | Path `/budgets/form` | Automated-pass |
| N7 | `/categories/form?id=cat_food` | Edit mode text with the id | Automated-pass |

Manual on the Android phone (Manual-pending):

| # | Case | Expected |
|---|---|---|
| M1 | Hamburger button on each tab | Drawer slides in |
| M2 | Swipe from the left edge | Drawer opens; swipe back or tap outside closes it |
| M3 | Drawer "Dashboard" while on the Budgets tab | Returns to Home and closes the drawer |
| M4 | Android Back from a modal (new transaction) | Returns to the previous screen |
| M5 | Android Back on Home | Leaves the app |
| M6 | Android Back from Categories | Returns to Home |
| M7 | Dark mode / French device language | App re-themes live; text in French after restart |
| M8 | Drawer and tab headers in dark mode | Readable, no white flash |

## Contexts, themes and preferences (Phase 3)

Automated (`npm test`): 41 tests in total.

| # | Case | Status |
|---|---|---|
| C1 | Theme follows the system in System mode; manual Light/Dark overrides it; saved and restored; corrupted saved value ignored | Automated-pass |
| C2 | Preferences default to device language and XOF; saved and restored; invalid fields dropped, valid kept | Automated-pass |
| C3 | Transactions context: add, update, remove; action functions keep the same identity (useCallback) | Automated-pass |
| C4 | Budgets context: current month at start, previous/next across a year boundary, create/update/remove | Automated-pass |
| C5 | Reducers (transactions, budgets): load lifecycle, no duplicate id, unknown id ignored, no mutation, invalid month ignored | Automated-pass |
| C6 | Dates and translations: month arithmetic, placeholders, hook outside provider fails with a clear message | Automated-pass |
| C7 | Settings: choosing Francais switches tab labels and texts app-wide and saves it; choosing Dark selects it and saves it | Automated-pass |

Manual on the Android phone (Manual-pending):

| # | Case | Expected |
|---|---|---|
| T1 | Settings > Theme > Dark, then Light, then System | Every screen (tabs, drawer, headers, modals) re-themes at once |
| T2 | Theme = System, toggle the phone dark mode | App follows live |
| T3 | Choose Dark, close the app completely, reopen | Still dark, no light flash at startup |
| T4 | Settings > Language > Francais | All labels become French at once, including tab bar and drawer |
| T5 | Close and reopen after changing language and currency | Choices are kept |
| T6 | Settings > Currency | Choice changes and is kept (it is used by transactions from Phase 4) |

## Database, transactions, categories and dashboard (Phase 4)

Automated (`npm test`): 105 tests in total, 11 suites.

| # | Case | Status |
|---|---|---|
| D-a | Migrations: schema, 13 seeded categories, `user_version = 1`, safe to run twice | Automated-pass |
| D-b | Database constraints: amount > 0, valid type, foreign keys, unique category name per type (any case) | Automated-pass |
| D-c | Repositories: insert / read newest first / update only given fields / soft delete hidden but kept; category must exist and match the type | Automated-pass |
| D-d | Budgets table: one active budget per category + month + currency; deleted budget can be re-created; bad month / zero limit rejected | Automated-pass |
| D-e | Money: parsing (no float errors, decimals per currency, rejects bad input, caps), formatting FR/EN, round trip | Automated-pass |
| D-f | Calculations: totals per currency and month, net can be negative, category spending order, sorting; recalculation after edit / delete | Automated-pass |
| D-g | Filters: search (case and accent insensitive), type, category, month, combined | Automated-pass |
| D-h | Validation: title, amount, category rules, date, description; every error message exists in FR and EN | Automated-pass |
| D-i | Contexts on SQLite: add / update / remove, wrong category type refused with state untouched, data survives restart | Automated-pass |
| D-j | Flows on the real screens: add expense (list, dashboard, database), validation errors, type switch resets category, restart, edit, delete with confirmation, search and filters, dashboard period and currency, categories add / duplicate / edit | Automated-pass |

Manual on the Android phone (Manual-pending):

| # | Case | Expected |
|---|---|---|
| D1 | Add an expense (FCFA 2500, Food), then force-close the app (swipe it away) and reopen | Transaction still there; dashboard totals unchanged |
| D2 | Add income and expense; compare Income, Expenses and Net with a hand calculation | Net = income - expenses |
| D3 | Edit the amount and the category of a transaction | List, detail and dashboard update |
| D4 | Delete a transaction (cancel once, then confirm) | Cancel keeps it; confirm removes it everywhere |
| D5 | Search "dejeuner" with a transaction titled "Déjeuner"; filter by type, category and month | Accent-insensitive match; filters combine |
| D6 | Dashboard "This month" vs "All time" with a transaction dated last month | Totals differ as expected |
| D7 | Settings: switch currency to EUR and back; add a EUR transaction | Totals only count the active currency; EUR amounts show cents |
| D8 | Open the amount field | Numeric keyboard; Save button reachable when the keyboard is open |
| D9 | Categories: add "Gifts" with an icon, edit "Food" (rename, color), try a duplicate name | Saved; duplicate refused with a message; type cannot be changed |
| D10 | Language Francais: dashboard, forms, errors, category names (Alimentation...) | Everything in French; renamed categories keep the typed name |
| D11 | Dark mode on dashboard, list, forms, categories | Readable, no white areas |
| D12 | Airplane mode on and off while using the app | Everything works (no network is used yet) |

## Budgets (Phase 5)

Automated (`npm test`): 161 tests in total, 13 suites.

| # | Case | Status |
|---|---|---|
| B-a | Spent counts only expenses of the budget category, month and currency; month boundaries (1st and last day in, neighbours out); income, other categories and other currencies excluded; deleted transactions excluded | Automated-pass |
| B-b | Status thresholds are exact: 79.99% normal, 80% approaching, 99.99% approaching, 100% reached, above 100% exceeded; works for limits where 80% is not a whole number; zero limit does not divide by zero | Automated-pass |
| B-c | Remaining, exceeded amount, real percentage above 100% (150%) with the bar capped; percentage rounded down (99.6% shows 99%); large amounts stay exact | Automated-pass |
| B-d | Automatic recalculation: create / edit amount / change category / change month / delete / income never counts | Automated-pass |
| B-e | Summaries per month and currency, most consumed first; totals (allocated, spent, remaining, count) | Automated-pass |
| B-f | Budget validation (limit > 0, expense category only, valid month, no duplicate, edit does not clash with itself) | Automated-pass |
| B-g | Budget repository on real SQLite: insert / read / update / soft delete, rules enforced, duplicate and partial unique index, month check | Automated-pass |
| B-h | Context: create / update / remove in SQLite, rejected duplicate leaves state untouched, live recalculation walkthrough (85%, 100%, 105%, category change, delete), data and figures survive a restart | Automated-pass |
| B-i | Flows on the real screens: create, expense-only categories, validation errors, duplicate refused, progress after new expenses (85% to 100% to 105%), category change moves spending, only matching transactions counted, edit, delete with confirmation, month navigation, dashboard overview, active currency only, restart | Automated-pass |

Manual on the Android phone (Manual-pending):

| # | Case | Expected |
|---|---|---|
| B1 | Create a Food budget of 100 000 FCFA, add Food expenses totalling 65 000 | Card shows 65%, remaining 35 000 FCFA, status Normal |
| B2 | Add expenses until 80%, then exactly 100%, then above | Status becomes Approaching limit, Budget reached, Budget exceeded; the bar stops at 100% but the percentage and "Exceeded by" keep growing |
| B3 | Edit an expense (amount, then category, then date to last month) | Both affected budgets update immediately |
| B4 | Delete an expense | Spending and percentage drop |
| B5 | Try to create a second Food budget for the same month | Refused with a message |
| B6 | Month arrows on the Budgets tab | Other months show their own budgets |
| B7 | Force-close and reopen | Budgets and figures are unchanged |
| B8 | Dashboard budget overview | Matches the Budgets tab for the current month |
| B9 | Status is readable without color (icon and text) and in dark mode | Yes |
| B10 | French labels on all budget screens | Yes |

## API and synchronization (Phase 6)

Automated: app `npm test` (200 tests, 16 suites) and `npm test` in `backend/` (20 tests).

| # | Case | Status |
|---|---|---|
| S-a | API on a real server: every endpoint, status codes, error shape, validation, category / budget rules, idempotent POST, PUT 404, DELETE 404, invalid JSON, unknown route, data kept in a JSON file after a restart | Automated-pass (backend) |
| S-b | API client with a mocked fetch: method, URL, headers, body, encoded ids, 204, validated lists, HTTP error mapping, invalid answers, network failure, timeout, URL from the environment | Automated-pass |
| S-c | Sync push: new row (PUT 404 then POST), edit (PUT), delete (DELETE then purge, also when the server never had it), order categories / budgets / transactions, local-only field never sent | Automated-pass |
| S-d | Sync problems: offline keeps everything pending and the next run sends it without duplicates, server error, unreadable answer, refusal marks only that row failed, failed rows retried, edit during a request not marked synced, second run sends nothing | Automated-pass |
| S-e | Sync pull: adds unknown server rows, synced rows take the server version, pending local changes never overwritten, local deletes not resurrected, rows lost by the server are sent again, conflicting server rows skipped | Automated-pass |
| S-f | In the app with a fake server: startup pull, automatic push and Pending badge disappearing, offline + "Sync now", Rejected badge and counter, delete sent, budgets and categories sent, no loading spinner during a sync; no server configured = works offline with no badges | Automated-pass |
| S-g | Real end-to-end (sandbox only, not delivered): real client + real sync engine + SQLite engine against the real Express server, including a real outage and restart, a second device pulling everything, and a 409 refusal | Passed once, not repeatable from the delivered files |

Manual (Manual-pending). First do the connection test: the phone's browser must open `http://<PC-address>:3000/health`.

| # | Case | Expected |
|---|---|---|
| S1 | Start the API (`cd backend; npm run dev`), set `.env`, run `npx expo start -c`, open the app | Settings shows "Up to date with the server."; the API console shows requests |
| S2 | Add a transaction | It appears on the server (`http://<PC-address>:3000/transactions` in the phone browser) within a second; no Pending badge stays |
| S3 | Stop the API, add a transaction, a budget and a category | Everything works; "Pending" badges; Settings says the server cannot be reached and counts the waiting changes |
| S4 | Start the API again, wait or press "Sync now" | Badges disappear, counter is 0, the server has everything once (no duplicates) |
| S5 | Edit and delete a synced transaction | The server copy changes / disappears |
| S6 | Put the phone in airplane mode, add data, switch it off again | Data kept, sent when the connection returns |
| S7 | Stop the API for good and use the app for a while | No crash, no spinner loops, no data loss; each screen still loads from SQLite |
| S8 | Delete `backend/data/db.json` while the API is stopped, restart the API, press "Sync now" | The phone sends its data again; the server has it back |
| S9 | Send the app to the background and bring it back | A sync starts (check the API console) |
| S10 | French labels in the Synchronization card and badges; dark mode | Yes |

## Later phases

Final integration (Phase 7), README, screenshots and GitHub (Phase 8): Planned.
