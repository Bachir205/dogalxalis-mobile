import { DEFAULT_CATEGORIES } from '@/constants/defaultCategories';
import { DataError } from '@/database/errors';
import { runMigrations } from '@/database/migrations';
import {
  getAllCategories,
  insertCategory,
  updateCategory,
} from '@/database/repositories/categoryRepository';
import {
  getAllTransactions,
  getTransactionById,
  insertTransaction,
  softDeleteTransaction,
  updateTransaction,
} from '@/database/repositories/transactionRepository';
import type { Category, Transaction } from '@/types';

import { createSqlJsDb, type SqlJsDb } from '../setup/sqlJsDatabase';

let db: SqlJsDb;

beforeEach(async () => {
  db = await createSqlJsDb();
  await runMigrations(db, '2026-11-01T00:00:00.000Z');
});

const transaction = (id: string, overrides: Partial<Transaction> = {}): Transaction => ({
  id,
  title: `Item ${id}`,
  amountMinor: 2500,
  currency: 'XOF',
  type: 'expense',
  categoryId: 'cat_food',
  description: null,
  date: '2026-11-10',
  createdAt: `2026-11-10T08:00:0${id.length}.000Z`,
  updatedAt: '2026-11-10T08:00:00.000Z',
  syncStatus: 'pending',
  ...overrides,
});

const category = (id: string, name: string, type: 'income' | 'expense' = 'expense'): Category => ({
  id,
  name,
  type,
  icon: 'tag',
  color: '#E67E22',
  createdAt: '2026-11-10T08:00:00.000Z',
  updatedAt: '2026-11-10T08:00:00.000Z',
  syncStatus: 'pending',
});

describe('migrations', () => {
  it('creates the schema, seeds the default categories and records the version', async () => {
    const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version', []);
    expect(version?.user_version).toBe(1);

    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      [],
    );
    expect(tables.map((t) => t.name)).toEqual(['budgets', 'categories', 'transactions']);

    const categories = await getAllCategories(db);
    expect(categories).toHaveLength(DEFAULT_CATEGORIES.length);
    expect(categories.filter((c) => c.type === 'expense')).toHaveLength(8);
    expect(categories.filter((c) => c.type === 'income')).toHaveLength(5);
  });

  it('is safe to run again (no duplicate categories, no error)', async () => {
    await runMigrations(db);
    await runMigrations(db);
    expect(await getAllCategories(db)).toHaveLength(DEFAULT_CATEGORIES.length);
  });
});

describe('transactions repository', () => {
  it('inserts, reads back, and returns the newest first', async () => {
    await insertTransaction(db, transaction('a', { date: '2026-11-01' }));
    await insertTransaction(db, transaction('bb', { date: '2026-11-09' }));
    await insertTransaction(db, transaction('ccc', { date: '2026-11-09' }));

    const all = await getAllTransactions(db);
    expect(all.map((t) => t.id)).toEqual(['ccc', 'bb', 'a']);
    expect(await getTransactionById(db, 'a')).toMatchObject({
      title: 'Item a',
      amountMinor: 2500,
      currency: 'XOF',
      categoryId: 'cat_food',
      date: '2026-11-01',
      description: null,
    });
  });

  it('rejects an unknown category and a category of the wrong type', async () => {
    await expect(insertTransaction(db, transaction('a', { categoryId: 'nope' }))).rejects.toMatchObject({
      code: 'CATEGORY_NOT_FOUND',
    });
    await expect(
      insertTransaction(db, transaction('b', { type: 'income', categoryId: 'cat_food' })),
    ).rejects.toMatchObject({ code: 'CATEGORY_TYPE_MISMATCH' });
    expect(await getAllTransactions(db)).toEqual([]);
  });

  it('is protected by the database itself (amount > 0, foreign keys, valid type)', async () => {
    const insertRaw = (amount: number, categoryId: string, type: string) =>
      db.runAsync(
        `INSERT INTO transactions (id, title, amount_minor, currency, type, category_id, occurred_at, created_at, updated_at)
         VALUES ('raw', 'x', ?, 'XOF', ?, ?, '2026-11-10', 'n', 'n')`,
        [amount, type, categoryId],
      );
    await expect(insertRaw(0, 'cat_food', 'expense')).rejects.toThrow(/CHECK constraint/i);
    await expect(insertRaw(-5, 'cat_food', 'expense')).rejects.toThrow(/CHECK constraint/i);
    await expect(insertRaw(100, 'cat_food', 'transfer')).rejects.toThrow(/CHECK constraint/i);
    await expect(insertRaw(100, 'missing', 'expense')).rejects.toThrow(/FOREIGN KEY/i);
  });

  it('updates only the given fields and marks the row pending', async () => {
    await insertTransaction(db, transaction('a', { syncStatus: 'synced' }));
    await updateTransaction(db, 'a', { amountMinor: 4000, categoryId: 'cat_transport' }, '2026-11-11T00:00:00.000Z');
    expect(await getTransactionById(db, 'a')).toMatchObject({
      title: 'Item a',
      amountMinor: 4000,
      categoryId: 'cat_transport',
      updatedAt: '2026-11-11T00:00:00.000Z',
      syncStatus: 'pending',
    });
  });

  it('re-checks the category rule on update and reports unknown ids', async () => {
    await insertTransaction(db, transaction('a'));
    await expect(updateTransaction(db, 'a', { type: 'income' }, 'now')).rejects.toMatchObject({
      code: 'CATEGORY_TYPE_MISMATCH',
    });
    await expect(
      updateTransaction(db, 'a', { type: 'income', categoryId: 'cat_salary' }, 'now'),
    ).resolves.toBeUndefined();
    await expect(updateTransaction(db, 'zzz', { title: 'x' }, 'now')).rejects.toBeInstanceOf(DataError);
  });

  it('soft-deletes: hidden from every read, but the row is kept until it is synced', async () => {
    await insertTransaction(db, transaction('a'));
    await insertTransaction(db, transaction('bb'));
    await softDeleteTransaction(db, 'a', '2026-11-12T00:00:00.000Z');

    expect((await getAllTransactions(db)).map((t) => t.id)).toEqual(['bb']);
    expect(await getTransactionById(db, 'a')).toBeNull();

    const kept = await db.getFirstAsync<{ deleted_at: string; sync_status: string }>(
      "SELECT deleted_at, sync_status FROM transactions WHERE id = 'a'",
      [],
    );
    expect(kept).toEqual({ deleted_at: '2026-11-12T00:00:00.000Z', sync_status: 'pending' });

    await expect(softDeleteTransaction(db, 'a', 'now')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('categories repository', () => {
  it('adds a custom category and refuses a duplicate name for the same type (any case)', async () => {
    await insertCategory(db, category('c1', 'Gifts'));
    await expect(insertCategory(db, category('c2', 'gifts'))).rejects.toMatchObject({ code: 'DUPLICATE' });
    await expect(insertCategory(db, category('c3', 'Gifts', 'income'))).resolves.toBeUndefined();
    expect(await getAllCategories(db)).toHaveLength(DEFAULT_CATEGORIES.length + 2);
  });

  it('edits name, icon and color; keeps the type; refuses a clashing name', async () => {
    await updateCategory(db, 'cat_food', { name: 'Groceries', icon: 'coffee', color: '#3498DB' }, '2026-11-11T00:00:00.000Z');
    const food = (await getAllCategories(db)).find((c) => c.id === 'cat_food');
    expect(food).toMatchObject({
      name: 'Groceries',
      icon: 'coffee',
      color: '#3498DB',
      type: 'expense',
      syncStatus: 'pending',
    });
    await expect(updateCategory(db, 'cat_bills', { name: 'groceries' }, 'now')).rejects.toMatchObject({
      code: 'DUPLICATE',
    });
    await expect(updateCategory(db, 'zzz', { name: 'x' }, 'now')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('budgets table (used from Phase 5)', () => {
  const insertBudget = (id: string, month = '2026-11') =>
    db.runAsync(
      `INSERT INTO budgets (id, category_id, amount_minor, currency, month, created_at, updated_at)
       VALUES (?, 'cat_food', 100000, 'XOF', ?, 'n', 'n')`,
      [id, month],
    );

  it('allows one active budget per category, month and currency', async () => {
    await insertBudget('b1');
    await expect(insertBudget('b2')).rejects.toThrow(/UNIQUE constraint/i);
    await expect(insertBudget('b3', '2026-12')).resolves.toBeDefined();
  });

  it('lets a deleted budget be re-created (partial unique index)', async () => {
    await insertBudget('b1');
    await db.runAsync("UPDATE budgets SET deleted_at = 'now' WHERE id = 'b1'", []);
    await expect(insertBudget('b2')).resolves.toBeDefined();
  });

  it('rejects a badly formatted month and a zero limit', async () => {
    await expect(insertBudget('b1', '2026-13x')).rejects.toThrow(/CHECK constraint/i);
    await expect(
      db.runAsync(
        `INSERT INTO budgets (id, category_id, amount_minor, currency, month, created_at, updated_at)
         VALUES ('z', 'cat_food', 0, 'XOF', '2026-11', 'n', 'n')`,
        [],
      ),
    ).rejects.toThrow(/CHECK constraint/i);
  });
});
