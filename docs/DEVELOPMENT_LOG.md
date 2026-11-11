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
**Not yet tested:** Phase 3 on the physical phone (theme and language switch, persistence after closing the app).
