# DogalXalis Mobile

DogalXalis Mobile is a local-first personal finance app built with Expo and React Native. It helps users track income and expenses, organize categories, manage monthly budgets, and keep a clear view of spending in a simple mobile-first dashboard.

The project is designed around a local SQLite source of truth with optional synchronization to a small Express API, making it usable offline while still supporting a backend-driven sync flow.

## Highlights

- Expense and income tracking with category-based organization
- Monthly budget planning and progress tracking
- Dashboard summaries for income, spending, net totals, and recent transactions
- Search, filtering, and date-based browsing for transactions
- French and English localization
- Light, dark, and system theme support
- Local-first data storage with SQLite
- Optional synchronization API for push/pull updates
- Demo data support for quick onboarding or presentation testing

## Tech Stack

- Expo SDK 58
- React Native + React 19
- Expo Router for app navigation
- TypeScript
- SQLite via expo-sqlite
- Zustand-like app state orchestration via context + reducers
- Zod validation
- Jest + React Native Testing Library
- Express API in the `backend/` package

## Project Structure

```text
.
├── app.json                     # Expo app config
├── assets/                     # App assets, icons, splash resources
├── backend/                    # Optional Express sync API
│   ├── src/
│   ├── tests/
│   └── package.json
├── docs/                       # Architecture, schema, roadmap, API and testing docs
├── src/
│   ├── app/                    # Expo Router screens and navigation
│   ├── components/             # Reusable UI and feature components
│   ├── contexts/               # App providers and state management
│   ├── database/               # SQLite schema, repositories, migrations
│   ├── hooks/                  # Shared app hooks
│   ├── i18n/                   # Locale dictionaries
│   ├── services/               # API + sync + demo data helpers
│   ├── theme/                  # Theme tokens, colors
│   ├── utils/                  # Money, date, filters, budget calculations
│   ├── validation/             # Zod validation schemas
│   └── constants/              # Categories, icons, user preferences
├── tests/                      # App-level and database tests
├── .env.example                # Sample environment config for the API URL
├── package.json                # Mobile app scripts and dependencies
├── tsconfig.json
├── LICENSE
└── README.md
```

## Getting Started

### 1) Install dependencies

Install the mobile app dependencies:

```bash
npm install
```

If you also want to run the sync backend, install its dependencies as well:

```bash
cd backend
npm install
```

### 2) Configure the API URL

Copy the example environment file:

```bash
cp .env.example .env
```

Then update the value of `EXPO_PUBLIC_API_URL` to your machine or LAN address when using the sync API:

```env
EXPO_PUBLIC_API_URL=http://<YOUR_PC_LAN_IP>:3000
```

If you leave it empty, the app works offline without the sync layer.

### 3) Run the mobile app

Start Expo:

```bash
npm start
```

Useful commands:

```bash
npm run android
npm run ios
npm run web
```

### 4) Run the backend API

In a separate terminal:

```bash
cd backend
npm run dev
```

The server listens on port `3000` by default and prints available local network addresses for device testing.

## Available Scripts

### Root app

```bash
npm start          # Start the Expo dev server
npm run android    # Open Android emulator/dev server
npm run ios        # Open iOS simulator/dev server
npm run web       # Run the web version
npm run lint       # Run Expo linting
npm test           # Run Jest tests
```

### Backend

```bash
cd backend
npm run dev        # Start the API in watch mode
npm run build      # Compile TypeScript
npm run start      # Run the built server
npm run typecheck  # Type-check the server
npm test           # Run backend tests
```

## App Behavior

The app centers on a local-first workflow:

1. Data is stored in SQLite on the device.
2. Screens read from local repositories and derive totals via shared utilities.
3. User actions validate inputs before writing to the database.
4. If a server URL is configured, pending changes are synchronized through the backend.
5. Sync status is visible through badges and banners in the UI.

This allows the app to remain useful without a network connection while still supporting eventual sync.

## Functional Areas

- Dashboard: spending summaries, recent transactions, budget overview
- Transactions: add, edit, list, filter, and inspect individual entries
- Budgets: define monthly limits by category and currency
- Categories: manage category definitions and icons/colors
- Settings: language, theme, currency, sync status, demo data controls
- About: app identity and guidelines

## Documentation

The repository includes design and implementation docs in the `docs/` folder:

- `docs/ARCHITECTURE.md` — app structure, state flow, and sync design
- `docs/DATABASE_SCHEMA.md` — SQLite schema and constraints
- `docs/API_SPECIFICATION.md` — backend contract
- `docs/ROADMAP.md` — implementation phases and status
- `docs/TEST_PLAN.md` — testing strategy

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Notes

This project is a presentation-ready prototype for a personal finance workflow. It is intentionally focused on data integrity, mobile UX, and a clean offline-first architecture rather than a broad financial platform.
