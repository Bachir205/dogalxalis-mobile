/**
 * Version 1 of the schema. Money is stored as integer minor units, dates as plain
 * calendar strings (occurred_at = YYYY-MM-DD), timestamps as ISO UTC strings.
 */
export const SCHEMA_V1: string[] = [
  `CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income','expense')),
    icon TEXT NOT NULL,
    color TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'pending'
      CHECK (sync_status IN ('synced','pending','failed'))
  )`,
  `CREATE UNIQUE INDEX ux_cat_name_type ON categories(name COLLATE NOCASE, type)`,

  `CREATE TABLE transactions (
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
    sync_status TEXT NOT NULL DEFAULT 'pending'
      CHECK (sync_status IN ('synced','pending','failed'))
  )`,
  `CREATE INDEX idx_tx_date ON transactions(occurred_at)`,
  `CREATE INDEX idx_tx_category ON transactions(category_id)`,
  `CREATE INDEX idx_tx_unsynced ON transactions(sync_status) WHERE sync_status <> 'synced'`,

  `CREATE TABLE budgets (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL REFERENCES categories(id),
    amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
    currency TEXT NOT NULL,
    month TEXT NOT NULL CHECK (month GLOB '[0-9][0-9][0-9][0-9]-[01][0-9]'),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    sync_status TEXT NOT NULL DEFAULT 'pending'
      CHECK (sync_status IN ('synced','pending','failed'))
  )`,
  // Partial index: a soft-deleted budget must not block re-creating the same category + month.
  `CREATE UNIQUE INDEX ux_budget_cat_month_cur
     ON budgets(category_id, month, currency) WHERE deleted_at IS NULL`,
];
