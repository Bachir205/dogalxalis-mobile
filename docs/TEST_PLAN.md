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

## Later phases

Money utilities, budget calculations, filters, reducers, repositories, API and sync tests: Planned (Phases 4 to 8).
