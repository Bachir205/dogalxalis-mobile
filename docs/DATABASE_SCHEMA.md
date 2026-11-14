# Database schema (SQLite, expo-sqlite)

Status: **implemented in Phase 4** (`src/database`). The budgets table and its repository are implemented in Phase 5.
Money is stored as integer minor units (XOF 0 decimals, EUR/USD 2). `occurred_at` is a local
calendar date `YYYY-MM-DD`; `created_at` / `updated_at` / `deleted_at` are ISO UTC timestamps.
Migrations use `PRAGMA user_version`; migration 1 creates the tables and seeds default categories
with fixed ids (`cat_food`, ...).

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income','expense')),
  icon TEXT NOT NULL,
  color TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('synced','pending','failed'))
);
CREATE UNIQUE INDEX ux_cat_name_type ON categories(name COLLATE NOCASE, type);

CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 60),
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
  currency TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income','expense')),
  category_id TEXT NOT NULL REFERENCES categories(id),
  description TEXT,
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('synced','pending','failed'))
);
CREATE INDEX idx_tx_date ON transactions(occurred_at);
CREATE INDEX idx_tx_category ON transactions(category_id);
CREATE INDEX idx_tx_unsynced ON transactions(sync_status) WHERE sync_status <> 'synced';

CREATE TABLE budgets (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id),
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
  currency TEXT NOT NULL,
  month TEXT NOT NULL CHECK (month GLOB '[0-9][0-9][0-9][0-9]-[01][0-9]'),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('synced','pending','failed'))
);
CREATE UNIQUE INDEX ux_budget_cat_month_cur
  ON budgets(category_id, month, currency) WHERE deleted_at IS NULL;
```

Deviations from the original brief: `budgets` gets `deleted_at` and `sync_status` (same sync strategy
as transactions) and its uniqueness is a **partial** unique index so a soft-deleted budget does not
block re-creating the same category and month. `categories` gets `sync_status` (create/edit from v1).

## Rules

- A transaction's category type must equal its type (enforced in Zod and tests).
- A category's type cannot change after creation; categories cannot be deleted in v1.
- Deleting always sets `deleted_at` and `sync_status = 'pending'` (soft delete). The row is purged by the
  synchronization once the API confirmed the delete (204, or 404 = already gone). With no server configured the soft-deleted
  rows simply stay in the table; every read ignores them. This is simpler and safer than telling
  "never synced" rows from "edited" rows, which are both `pending`. All reads exclude `deleted_at IS NOT NULL`,
  so totals and budgets ignore a deleted row immediately.
- The category rules are enforced in three places: Zod (forms), the repository (`DataError` codes
  `CATEGORY_NOT_FOUND`, `CATEGORY_TYPE_MISMATCH`, `DUPLICATE`) and the database (foreign keys, CHECK constraints,
  unique indexes). `PRAGMA foreign_keys = ON` is run on every connection.
- `occurred_at` is `YYYY-MM-DD`; the month of a transaction is its first 7 characters.
- Budgets: the category must be an **expense** category (`CATEGORY_TYPE_MISMATCH` otherwise), the month must be a real
  month (`INVALID_MONTH`; the CHECK only validates the shape `YYYY-MM`, so the repository also rejects `2026-13`),
  and one active budget per category + month + currency (`DUPLICATE`, from the partial unique index). Deleting is a soft delete.

## Budget calculations (single implementation in `src/utils/budgetCalculations.ts`)

- Spent = sum of `amount_minor` of transactions with type `expense`, same category, same currency,
  `occurred_at` in the budget month, not deleted.
- Remaining = limit - spent (may be negative). Exceeded = max(0, spent - limit).
- Progress = spent / limit x 100 (limit 0 returns 0). Displayed value is floored; the bar is capped at 100%.
- Status uses integer comparison: `spent*100 < limit*80` normal; `< limit*100` approaching;
  `== limit*100` reached; above that exceeded.
