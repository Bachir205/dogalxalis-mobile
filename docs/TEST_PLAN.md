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

## Later phases

Budget repository and calculations (Phase 5), API and sync (Phase 6), final integration (Phase 7): Planned.
