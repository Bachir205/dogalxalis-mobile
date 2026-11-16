import { DEFAULT_CATEGORIES } from '@/constants/defaultCategories';

import { SCHEMA_V1 } from '../schema';
import type { Db } from '../types';

export interface Migration {
  version: number;
  up: (db: Db, now: string) => Promise<void>;
}

/** Migration 1: all tables, indexes and the default categories. */
async function migration001(db: Db, now: string): Promise<void> {
  for (const statement of SCHEMA_V1) {
    await db.execAsync(statement);
  }
  for (const category of DEFAULT_CATEGORIES) {
    await db.runAsync(
      `INSERT OR IGNORE INTO categories
         (id, name, type, icon, color, created_at, updated_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'synced')`,
      [category.id, category.name, category.type, category.icon, category.color, now, now],
    );
  }
}

/**
 * Migration 2: a flag that marks the sample ("demo") records, so they are clearly identifiable
 * and can be removed without touching the user's own data. Existing rows get 0 (not demo).
 */
async function migration002(db: Db): Promise<void> {
  await db.execAsync(
    'ALTER TABLE transactions ADD COLUMN is_demo INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1))',
  );
  await db.execAsync(
    'ALTER TABLE budgets ADD COLUMN is_demo INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1))',
  );
}

/** Ordered list. To change the schema, add a new version; never edit one that has shipped. */
export const MIGRATIONS: Migration[] = [
  { version: 1, up: migration001 },
  { version: 2, up: migration002 },
];

/**
 * Brings the database up to date. The schema version is stored in SQLite's `user_version`.
 * Each migration and its version bump run in one transaction: all or nothing.
 */
export async function runMigrations(db: Db, now: string = new Date().toISOString()): Promise<void> {
  // Foreign keys are off by default in SQLite and must be enabled on every connection.
  await db.execAsync('PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version', []);
  const current = row?.user_version ?? 0;

  for (const migration of MIGRATIONS) {
    if (migration.version <= current) continue;
    await db.withTransactionAsync(async () => {
      await migration.up(db, now);
      await db.execAsync(`PRAGMA user_version = ${migration.version};`);
    });
  }
}
