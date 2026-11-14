# Development log

## 2026-11-10, Phase 0 (design only)
- Requirements analysed; architecture, schema, API contract and sync strategy designed.
- Decisions: SDK 58 with Expo Go 58; own Express API; dashboard = current month (+ optional all time);
  currencies XOF/EUR/USD; categories create/edit from v1; React Hook Form + Zod; UI in French and English.

## 2026-11-10, Phase 1 (foundation)
- Template: `create-expo-app --template default@sdk-58` (routes live in `src/app`, alias `@/*` -> `./src/*`).
- Added `expo-localization`, `react-native-svg`, `lucide-react-native`; removed unused starter packages.
- `app.json`: name `DogalXalis`, scheme `dogalxalis`, React Compiler disabled.
- Added theme tokens, `useTheme` (system scheme only for now), i18n skeleton (`t()`, FR/EN),
  UI basics (ScreenContainer, AppText, AppCard, AppButton, EmptyState), root layout, foundation screen.

Verified in a sandbox (no device): `tsc --noEmit` passes (strict), `expo export --platform android` bundles,
`expo-doctor` 18/20 checks pass (the 2 remaining need internet access to the Expo API).
Device test: confirmed working in Expo Go by the developer.

## 2026-11-10, Phase 2 (navigation)
- Root Stack (`src/app/_layout.tsx`) wraps everything in `GestureHandlerRootView`; the Drawer is its first screen,
  forms and detail screens are pushed above it as modals/details.
- Drawer (`expo-router/drawer`) with a custom menu (`AppDrawerContent`): Dashboard (points at Home `/`), Categories, About.
- Tabs imported from `expo-router/js-tabs` (the `Tabs` export of `expo-router` is deprecated in SDK 58): Home, Transactions, Budgets, Settings.
  Each tab header has a translated hamburger button that opens the drawer.
- Shell screens for every route (`ShellScreen`), a floating "add transaction" button on Home and Transactions,
  About page with real content. Old Phase 1 `src/app/index.tsx` removed (Home is now `(drawer)/(tabs)/index.tsx`).
- `ScreenContainer` got an `edges` prop (navigators already pad the header and the tab bar).
- Dev dependencies added: `jest`, `jest-expo`, `@testing-library/react-native`, `@types/jest`. Do not install
  `react-test-renderer` (peer conflict with React 19.3).

Verified in a sandbox (no device): `tsc --noEmit` passes, Android bundle builds, 7 automated navigation tests pass
(`tests/integration/navigation.test.tsx`, see `TEST_PLAN.md`).
Device test: the app runs in Expo Go. **Not yet confirmed:** the full manual checklist in `TEST_PLAN.md` (drawer swipe, Android Back).

## 2026-11-11, Phase 3 (contexts and themes)
- `ThemeContext` (Light / Dark / System, persisted), `PreferencesContext` (language, currency, persisted),
  `TransactionsContext` and `BudgetsContext` with pure reducers and in-memory state (persistence comes in Phases 4 to 6).
- `useTheme` now reads the context; `useI18n` reads the language chosen in Settings (live, app-wide).
- Real Settings screen (theme, language, currency, app info) with a reusable `SegmentedControl`.
- `AppGate` + splash screen: the app opens only after the saved theme and language are read.
- New dependencies: `@react-native-async-storage/async-storage`, `expo-crypto` (installed with `npx expo install`).
- Jest: `jest.config.js` now has `setupFilesAfterEnv` (mocks for AsyncStorage, expo-crypto, expo-splash-screen, device language).
- Lessons: with `@testing-library/react-native` 14, `unmount` must be awaited; expo-router's test renderer uses fake
  timers, so helpers must not wait on `setTimeout`.

Verified in a sandbox (no device): `tsc --noEmit` passes, Android bundle builds, 41 automated tests pass
(unit: dates, reducers, i18n; integration: contexts, navigation, Settings flows).
Developer moved on to Phase 4 after Phase 3; the manual checklist T1 to T6 (see `TEST_PLAN.md`) was not reported.

## 2026-11-11, Phase 4 (SQLite, categories, transactions, dashboard)
- Database: `Db` interface, schema v1 (categories, transactions, budgets), migrations with `PRAGMA user_version`,
  13 seeded default categories (fixed ids), `getDatabase()` singleton, `DatabaseProvider` (spinner / error + retry).
- Repositories for categories and transactions (parameterized SQL only). Business rules enforced in the repository
  (`DataError`) and by the database (foreign keys, CHECK, unique indexes). Deleting is a soft delete.
- Money utilities (integer minor units, string parsing, per-language formatting), date helpers, calculation and filter
  functions (pure, tested), Zod schemas (messages are translation keys), `getCategoryName` (seeded names are translated).
- Contexts: `CategoriesContext` (new), `TransactionsContext` now reads/writes SQLite, `useCategories`, `useDatabase`.
- Screens: dashboard (period toggle, income / expenses / net / count, spending by category, recent transactions),
  transactions list (search, type / category / month filters), transaction form (create and edit, React Hook Form + Zod),
  details with Edit and Delete (confirmation), categories list and form (create and edit, type locked after creation).
- New components: AppInput, Chip, MonthSwitcher, LoadingState, ErrorState, CategoryBadge, CategorySelector,
  TransactionCard, SummaryCard, TransactionForm, CategoryForm, confirmAction.
- New dependencies: `expo-sqlite` (npx expo install), `zod`, `react-hook-form`, `@hookform/resolvers` (npm),
  dev: `sql.js`, `@types/sql.js`.
- Budget overview on the dashboard is a placeholder until Phase 5.

Verified in a sandbox (no device): `tsc --noEmit` passes, Android bundle builds, 105 automated tests pass in
11 suites (unit: money, dates, calculations, filters, validation, reducers, i18n; integration: migrations and repositories on
real SQLite, contexts, navigation, end-to-end flows on the real screens).
Developer moved on to Phase 5; the manual checklist D1 to D12 (see `TEST_PLAN.md`) was not reported.

## 2026-11-12, Phase 5 (monthly budgets)
- `budgetRepository` (insert / read / update / soft delete) with the budget rules: expense categories only, real month,
  one budget per category + month + currency. Shared rules moved to `src/database/rules.ts`.
- `src/utils/budgetCalculations.ts`: spent (expense, same category, month and currency), remaining, exceeded amount,
  real percentage (rounded down, not capped), bar percentage (capped), status with integer thresholds, summaries, totals.
- `budgetSchema` (Zod): limit > 0, existing expense category, valid month, duplicate check (the edited budget does not clash with itself).
- `BudgetsContext` now reads and writes SQLite and exposes `summaries` and `totals` for the selected month (derived with
  `useMemo` from the budgets and the transactions); `useBudgetOverview(month)` for the dashboard.
- Screens: Budgets tab (month switcher, 4 summary cards, one card per budget, empty state, floating add button),
  budget form (create and edit, delete with confirmation, month switcher, read-only currency), dashboard budget overview.
- Components: BudgetCard, BudgetProgressBar, BudgetStatusBadge (icon + text + color), BudgetForm, BudgetOverviewCard.
- Test helper change: the loading screen has `testID="loading-state"` (budget progress bars are progressbars too).

Verified in a sandbox (no device): `tsc --noEmit` passes, Android bundle builds, 161 automated tests pass in 13 suites.
Developer moved on to Phase 6; the manual checklist B1 to B10 (see `TEST_PLAN.md`) was not reported.

## 2026-11-14, Phase 6 (Express API and synchronization)
- `backend/`: Express 5 + TypeScript + Zod, layers routes -> controllers -> services -> JSON-file store, uniform error shape,
  idempotent POST, rules identical to the app (category type, expense-only budgets, duplicates, immutable category type),
  `0.0.0.0` listening with LAN addresses printed, 20 tests on a real server (`npm test` in `backend/`).
- App: centralized `ApiClient` (`src/services/api.ts`): 8 s timeout, typed `ApiError` (network / timeout / http / invalid),
  Zod validation of every answer, URL from `EXPO_PUBLIC_API_URL` (null = offline-only). `.env.example` added.
- Sync engine (`syncService.ts`) + `syncRepository.ts` + `SyncContext` (startup, foreground, 400 ms after a change, "Sync now").
  Contexts gained a silent `reload()` and notify the sync after each local write.
- UI: Pending / Rejected badges, Synchronization card in Settings.
- Root `tsconfig.json` now excludes `backend/` (it has its own `tsconfig.json`).
- Versions: backend pinned to TypeScript ~6.0.3 and @types/node ^22 (npm would otherwise pick TypeScript 7 and Node 26 types).

Verified in a sandbox (no phone): app `tsc` and Android bundle pass; 200 app tests in 16 suites; 20 API tests; backend build and
compiled server answer real requests; a real end-to-end script (real API client + real sync engine + SQLite engine against
the real server) passed, including a real server outage, a restart that kept the data, a second "phone" pulling everything,
and a 409 refusal. The end-to-end script is not part of the delivered test suite.
**Not yet tested:** the phone reaching the PC over Wi-Fi (firewall, `http://` in Expo Go), sync on the real device (checklist S1 to S10).
