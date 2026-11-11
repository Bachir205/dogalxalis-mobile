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

## Later phases

Money utilities, budget calculations, filters, reducers, repositories, API and sync tests: Planned (Phases 4 to 8).
