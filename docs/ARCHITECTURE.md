# Architecture: DogalXalis Mobile (Presentation Edition)

Status: **design approved (Phase 0)**. Implementation status per phase is in `ROADMAP.md`.

## Layers

```
UI (src/app routes + src/components)          presentation only
        | useTheme / useI18n / useCategories / useTransactions / useBudgets
Contexts + reducers (src/contexts, src/reducers)   state + orchestration
        |
Services (src/services: api client, sync)    Repositories (src/database/repositories: all SQL)
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
| TransactionsContext | transactions, status, error (useReducer) | in memory now; SQLite in Phase 4, API in Phase 6 | State and actions implemented, persistence planned |
| BudgetsContext | budgets, selectedMonth, status, error (useReducer) | in memory now; SQLite in Phase 5 | State and actions implemented, rules and calculations planned |
| CategoriesContext | categories, status, error | SQLite (+ API) | Planned (Phase 4, needs the database and seeds) |

Provider order (`src/contexts/AppProviders.tsx`): `Theme > Preferences > Transactions > Budgets`.
Phase 4 inserts the database gate and CategoriesProvider before Transactions.
`AppGate` keeps the splash screen visible until the saved theme and language are loaded, so the app never
flashes the wrong theme or language. Hooks (`useTheme`, `usePreferences`, `useTransactions`, `useBudgets`)
fail with a clear message when used outside their provider.
Budget spent / remaining are never stored: `computeBudgetSummaries(budgets, transactions, month)`
(pure function, Phase 5) is wrapped in `useMemo`.
The dashboard period toggle ("This month / All time") is local screen state (`useState`), decided in Phase 4.

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
