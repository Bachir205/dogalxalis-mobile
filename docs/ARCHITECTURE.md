# Architecture: DogalXalis Mobile (Presentation Edition)

Status: **design approved (Phase 0)**. Implementation status per phase is in `ROADMAP.md`.

## Layers

```
UI (src/app routes + src/components)          presentation only
        | useTheme / useI18n / useCategories / useTransactions / useBudgets
Contexts + reducers (src/contexts, src/reducers)   state + orchestration
        |
Services (src/services: storage now; api client and sync in Phase 6)    Repositories (src/database/repositories: all SQL)
        |
Pure utils (src/utils: money, date, budgetCalculations, filters)   no React, no I/O, unit-tested
```

Rules: no SQL or `fetch` in screens; every financial formula exists once in `src/utils`;
Zod schemas in `src/validation` are the single validation source (forms and API payloads);
no hard-coded user-visible strings (everything goes through `t()`).

## Navigation (Expo Router, routes in `src/app`)

```
src/app/_layout.tsx                 providers + root Stack
  (drawer)/_layout.tsx              Drawer: Dashboard, Categories, About
    (tabs)/_layout.tsx              Tabs: Home, Transactions, Budgets, Settings
    categories.tsx, about.tsx
  transactions/new.tsx, [id].tsx, edit/[id].tsx     (modal / detail, above the drawer)
  budgets/form.tsx                  create/edit via ?id= and ?month=
  categories/form.tsx               create/edit via ?id=
```

- Tabs hold the four frequent destinations; the Drawer holds secondary pages and app identity.
- Forms and detail screens live in the root Stack so they do not appear as drawer items and Android Back works.
- The drawer entry for `(tabs)` is labelled "Dashboard"; its item calls `router.navigate('/')`.
- There is no root `index.tsx`: Home is `(drawer)/(tabs)/index.tsx` (avoids a duplicate `/` route).
- JS tabs (`import { Tabs } from 'expo-router/js-tabs'`, not NativeTabs) are used so they nest in the Drawer and share the app theme.
- The root layout wraps everything in `GestureHandlerRootView` (required by the Drawer gestures).
- `ScreenContainer` takes an `edges` prop: tab screens pass `[]` (header and tab bar already pad), other screens keep `['bottom']`.

## Contexts

| Context | State | Persistence | Status |
|---|---|---|---|
| ThemeContext | mode (light/dark/system), resolved scheme, isReady | AsyncStorage | Implemented (Phase 3) |
| PreferencesContext | language (fr/en), currency (XOF/EUR/USD), isReady | AsyncStorage | Implemented (Phase 3) |
| DatabaseContext | the open SQLite database; loading and error screens | SQLite file `dogalxalis.db` | Implemented (Phase 4) |
| CategoriesContext | categories, status, error (useReducer) | SQLite | Implemented (Phase 4); API in Phase 6 |
| TransactionsContext | transactions, status, error (useReducer) | SQLite | Implemented (Phase 4); API in Phase 6 |
| BudgetsContext | budgets, selectedMonth, derived summaries and totals, status, error (useReducer) | SQLite | Implemented (Phase 5); API in Phase 6 |

Provider order (`src/contexts/AppProviders.tsx`): `Theme > Preferences > Database > Categories > Transactions > Budgets`.
`AppGate` keeps the splash screen visible until the saved theme and language are loaded. `DatabaseProvider` opens
SQLite and runs the migrations before anything that needs data is rendered (spinner while it opens, error screen with
"Try again" if it fails).

Write path (database first, screen second): form -> Zod validation -> context action -> repository (SQL) ->
only if that succeeded, `dispatch` updates the screen state. If the repository throws (for example a category of
the wrong type), the state is untouched and the form shows an error.

Read path: on mount each provider loads from its repository (`useEffect`), then screens derive values with `useMemo`
from pure functions in `src/utils` (`computeTotals`, `computeCategorySpending`, `filterTransactions`,
`sortTransactions`). There is one implementation of every financial formula.

Money: integer minor units everywhere (`src/utils/money.ts`): `parseAmountInput` uses string arithmetic (never
`parseFloat * 100`), `formatMinor` formats per language and currency.

Budget spent / remaining / progress are never stored. `computeBudgetSummaries(budgets, transactions, { month, currency })`
(pure function in `src/utils/budgetCalculations.ts`) is wrapped in `useMemo` inside `BudgetsProvider`, which reads
`useTransactions()`. Adding, editing or deleting an expense changes the transactions array, so every budget on screen
recalculates by itself (including when an expense changes category or month: the old and the new budget both update).
The dashboard uses `useBudgetOverview(currentMonth)`, the same pure functions for any month.

Budget statuses (integer comparisons, no floats): normal below 80%, approaching from 80% up to 100%, reached at exactly 100%,
exceeded above 100%. The displayed percentage is rounded down and never capped; only the bar is capped at 100%.

## Hooks

`useState` (forms, filters, toggles), `useEffect` (load preferences, open DB and load data, background
sync, AppState), `useContext` (inside the custom hooks), `useReducer` (transactions, budgets),
`useMemo` (totals, filtered lists, budget summaries), `useCallback` (stable context actions),
React Hook Form `useForm` + `Controller` (transaction, budget, category forms).

React Compiler is **disabled** (`experiments.reactCompiler: false` in `app.json`) so manual
`useMemo` / `useCallback` behave exactly as taught and can be explained in the presentation.

## Local-first sync

SQLite is the source of truth; the Express API is a replica. Writes go to SQLite first
(`sync_status = 'pending'`), then to the API (success: `synced`; network error: stays `pending`;
4xx: `failed`). Push order: categories, then budgets and transactions. Pull = validated upsert; a
synced local row missing on the server is re-marked `pending` (never deleted).
Limitations: single device, last write wins, no propagation of deletions made elsewhere,
no NetInfo (offline is detected by failed requests).

## Theme and i18n

Semantic tokens in `src/theme`; components read them through `useTheme()`. Translations are typed
dictionaries (`src/i18n/en.ts`, `fr.ts`): a key missing in one language is a TypeScript error.

## Testing the database layer

Repositories and migrations take a small `Db` interface (`src/database/types.ts`) that expo-sqlite satisfies.
In Jest the same SQL runs on sql.js (pure-JavaScript SQLite) through `tests/setup/sqlJsDatabase.ts`, and the
`expo-sqlite` module is replaced by an in-memory database that survives unmount/remount, so "close and reopen the
app" is testable. Native-only behaviour (the real SQLite file on the phone) is covered by the manual checklist.
