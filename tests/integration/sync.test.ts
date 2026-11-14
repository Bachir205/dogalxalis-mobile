import { runMigrations } from '@/database/migrations';
import {
  getAllBudgets,
  insertBudget,
  softDeleteBudget,
} from '@/database/repositories/budgetRepository';
import { getAllCategories, insertCategory } from '@/database/repositories/categoryRepository';
import { countUnsynced } from '@/database/repositories/syncRepository';
import {
  getAllTransactions,
  getTransactionById,
  insertTransaction,
  softDeleteTransaction,
  updateTransaction,
} from '@/database/repositories/transactionRepository';
import { runSync } from '@/services/syncService';
import type { Budget, Category, Transaction } from '@/types';

import { FakeApi } from '../setup/fakeApi';
import { createSqlJsDb, type SqlJsDb } from '../setup/sqlJsDatabase';

let db: SqlJsDb;
let api: FakeApi;

beforeEach(async () => {
  db = await createSqlJsDb();
  await runMigrations(db, '2026-11-01T00:00:00.000Z'); // default categories are already "synced"
  api = new FakeApi();
});

const tx = (id: string, overrides: Partial<Transaction> = {}): Transaction => ({
  id,
  title: `Item ${id}`,
  amountMinor: 2500,
  currency: 'XOF',
  type: 'expense',
  categoryId: 'cat_food',
  description: null,
  date: '2026-11-10',
  createdAt: `2026-11-10T08:00:00.${id.length}00Z`,
  updatedAt: '2026-11-10T08:00:00.000Z',
  syncStatus: 'pending',
  ...overrides,
});
const budget = (id: string, overrides: Partial<Budget> = {}): Budget => ({
  id,
  categoryId: 'cat_food',
  amountMinor: 10000,
  currency: 'XOF',
  month: '2026-11',
  createdAt: '2026-11-10T09:00:00.000Z',
  updatedAt: '2026-11-10T09:00:00.000Z',
  syncStatus: 'pending',
  ...overrides,
});
const category = (id: string, name: string): Category => ({
  id,
  name,
  type: 'expense',
  icon: 'gift',
  color: '#E67E22',
  createdAt: '2026-11-10T07:00:00.000Z',
  updatedAt: '2026-11-10T07:00:00.000Z',
  syncStatus: 'pending',
});

const statusOf = async (id: string) =>
  (await db.getFirstAsync<{ sync_status: string }>('SELECT sync_status FROM transactions WHERE id = ?', [id]))?.sync_status;

describe('pushing local changes', () => {
  it('sends a new record: PUT answers 404, so it falls back to POST, then the row is synced', async () => {
    await insertTransaction(db, tx('t1'));
    const result = await runSync(db, api);

    expect(result).toMatchObject({ outcome: 'synced', pushed: 1, rejected: 0 });
    expect(api.calls).toContain('PUT transactions/t1');
    expect(api.calls).toContain('POST transactions');
    expect(api.transactions.get('t1')).toMatchObject({ id: 't1', title: 'Item t1', amountMinor: 2500 });
    expect(api.transactions.get('t1')).not.toHaveProperty('syncStatus'); // local-only field is never sent
    expect(await statusOf('t1')).toBe('synced');
  });

  it('sends an edit with PUT only, and the server copy changes', async () => {
    await insertTransaction(db, tx('t1'));
    await runSync(db, api);
    api.calls = [];

    await updateTransaction(db, 't1', { title: 'Edited', amountMinor: 4000 }, '2026-11-11T00:00:00.000Z');
    expect(await statusOf('t1')).toBe('pending');
    await runSync(db, api);

    expect(api.calls.filter((c) => c.includes('transactions/t1') || c === 'POST transactions')).toEqual(['PUT transactions/t1']);
    expect(api.transactions.get('t1')).toMatchObject({ title: 'Edited', amountMinor: 4000 });
    expect(await statusOf('t1')).toBe('synced');
  });

  it('sends categories first, then budgets and transactions (the server checks the categories)', async () => {
    await insertCategory(db, category('c1', 'Gifts'));
    await insertTransaction(db, tx('t1', { categoryId: 'c1' }));
    await insertBudget(db, budget('b1', { categoryId: 'c1' }));
    const result = await runSync(db, api);

    expect(result).toMatchObject({ outcome: 'synced', pushed: 3, rejected: 0 });
    const firstCall = (prefix: string) => api.calls.findIndex((c) => c.includes(prefix));
    expect(firstCall('categories/c1')).toBeLessThan(firstCall('budgets/b1'));
    expect(firstCall('budgets/b1')).toBeLessThan(firstCall('transactions/t1'));
    expect(api.transactions.has('t1')).toBe(true);
  });

  it('sends a deletion with DELETE and then removes the row for good', async () => {
    await insertTransaction(db, tx('t1'));
    await runSync(db, api);
    await softDeleteTransaction(db, 't1', '2026-11-12T00:00:00.000Z');
    await runSync(db, api);

    expect(api.calls).toContain('DELETE transactions/t1');
    expect(api.transactions.has('t1')).toBe(false);
    expect(await db.getFirstAsync('SELECT id FROM transactions WHERE id = ?', ['t1'])).toBeNull();
  });

  it('a deletion of something the server never had (404) still completes', async () => {
    await insertTransaction(db, tx('t1'));
    await softDeleteTransaction(db, 't1', '2026-11-12T00:00:00.000Z'); // created and deleted while offline
    const result = await runSync(db, api);
    expect(result).toMatchObject({ outcome: 'synced', pushed: 1 });
    expect(await db.getFirstAsync('SELECT id FROM transactions WHERE id = ?', ['t1'])).toBeNull();
  });

  it('syncs budgets too, including a deletion', async () => {
    await insertBudget(db, budget('b1'));
    await runSync(db, api);
    expect(api.budgets.has('b1')).toBe(true);
    await softDeleteBudget(db, 'b1', '2026-11-12T00:00:00.000Z');
    await runSync(db, api);
    expect(api.budgets.has('b1')).toBe(false);
    expect(await getAllBudgets(db)).toEqual([]);
  });
});

describe('problems', () => {
  it('offline: nothing is lost, everything stays pending, and the next run sends it without duplicates', async () => {
    await insertTransaction(db, tx('t1'));
    await insertTransaction(db, tx('t2'));
    api.offline = true;
    const offline = await runSync(db, api);
    expect(offline.outcome).toBe('offline');
    expect(offline.error?.kind).toBe('network');
    expect(await countUnsynced(db)).toEqual({ pending: 2, failed: 0 });
    expect(await getAllTransactions(db)).toHaveLength(2);

    api.offline = false;
    const online = await runSync(db, api);
    expect(online).toMatchObject({ outcome: 'synced', pushed: 2 });
    expect(api.transactions.size).toBe(2);
    expect(await countUnsynced(db)).toEqual({ pending: 0, failed: 0 });
  });

  it('a server error (500) keeps everything pending', async () => {
    await insertTransaction(db, tx('t1'));
    api.serverError = true;
    expect((await runSync(db, api)).outcome).toBe('error');
    expect(await statusOf('t1')).toBe('pending');
  });

  it('an unreadable answer is treated as a server problem and loses nothing', async () => {
    await insertTransaction(db, tx('t1'));
    api.invalidAnswer = true;
    expect((await runSync(db, api)).outcome).toBe('error');
    expect(await getAllTransactions(db)).toHaveLength(1);
    api.invalidAnswer = false;
    expect((await runSync(db, api)).outcome).toBe('synced');
    expect(api.transactions.size).toBe(1); // the first POST had been saved: idempotent, no duplicate
  });

  it('a refusal (4xx) marks only that row as failed; the others are still sent', async () => {
    await insertTransaction(db, tx('bad'));
    await insertTransaction(db, tx('good'));
    api.rejectIds.add('bad');
    const result = await runSync(db, api);

    expect(result).toMatchObject({ outcome: 'synced', pushed: 1, rejected: 1 });
    expect(await statusOf('bad')).toBe('failed');
    expect(await statusOf('good')).toBe('synced');
    expect(await countUnsynced(db)).toEqual({ pending: 0, failed: 1 });
    expect(await getTransactionById(db, 'bad')).not.toBeNull(); // still on the phone
  });

  it('a failed row is tried again on the next run', async () => {
    await insertTransaction(db, tx('bad'));
    api.rejectIds.add('bad');
    await runSync(db, api);
    api.rejectIds.clear();
    const retry = await runSync(db, api);
    expect(retry).toMatchObject({ pushed: 1, rejected: 0 });
    expect(await statusOf('bad')).toBe('synced');
  });

  it('a change made while a request is in flight is not marked as synced (it is sent next time)', async () => {
    await insertTransaction(db, tx('t1'));
    let edited = false;
    api.duringRequest = async (call) => {
      if (call === 'PUT transactions/t1' && !edited) {
        edited = true;
        await updateTransaction(db, 't1', { title: 'Edited meanwhile' }, '2026-11-13T00:00:00.000Z');
      }
    };
    await runSync(db, api);
    expect(await statusOf('t1')).toBe('pending');
    expect(api.transactions.get('t1')?.title).toBe('Item t1'); // the older version reached the server

    api.duringRequest = null;
    await runSync(db, api);
    expect(api.transactions.get('t1')?.title).toBe('Edited meanwhile');
    expect(await statusOf('t1')).toBe('synced');
  });

  it('running again when nothing changed sends nothing and duplicates nothing', async () => {
    await insertTransaction(db, tx('t1'));
    await runSync(db, api);
    api.calls = [];
    const again = await runSync(db, api);
    expect(again).toMatchObject({ outcome: 'synced', pushed: 0, rejected: 0 });
    expect(api.calls.filter((c) => !c.startsWith('GET'))).toEqual([]);
    expect(api.transactions.size).toBe(1);
  });
});

describe('pulling the server data', () => {
  const serverTx = (id: string, overrides = {}) => ({
    id, title: `Server ${id}`, amountMinor: 700, currency: 'XOF' as const, type: 'expense' as const,
    categoryId: 'cat_food', description: null, date: '2026-11-09',
    createdAt: '2026-11-09T08:00:00.000Z', updatedAt: '2026-11-09T08:00:00.000Z', ...overrides,
  });

  it('adds records the phone does not have, as synced', async () => {
    api.transactions.set('s1', serverTx('s1'));
    const result = await runSync(db, api);
    expect(result.pulled).toBeGreaterThan(0);
    expect(await getTransactionById(db, 's1')).toMatchObject({ title: 'Server s1', syncStatus: 'synced' });
  });

  it('a synced local record takes the server version', async () => {
    await insertTransaction(db, tx('t1'));
    await runSync(db, api);
    api.transactions.set('t1', serverTx('t1', { title: 'Changed on the server', updatedAt: '2026-11-15T00:00:00.000Z' }));
    await runSync(db, api);
    expect((await getTransactionById(db, 't1'))?.title).toBe('Changed on the server');
  });

  it('a local change that is still pending is never overwritten by the server', async () => {
    await insertTransaction(db, tx('t1'));
    await runSync(db, api);
    await updateTransaction(db, 't1', { title: 'My offline edit' }, '2026-11-16T00:00:00.000Z');
    api.transactions.set('t1', serverTx('t1', { title: 'Older server copy' }));
    api.rejectIds.add('t1'); // the push is refused, so the row stays local-only
    await runSync(db, api);
    expect((await getTransactionById(db, 't1'))?.title).toBe('My offline edit');
  });

  it('a record deleted on the phone is not brought back by the pull', async () => {
    await insertTransaction(db, tx('t1'));
    await runSync(db, api);
    await softDeleteTransaction(db, 't1', '2026-11-17T00:00:00.000Z');
    api.rejectIds.add('t1'); // the delete is refused: the row stays "deleted, waiting"
    await runSync(db, api);
    expect(await getTransactionById(db, 't1')).toBeNull();
    expect(await getAllTransactions(db)).toEqual([]);
  });

  it('a record the server lost is sent again (the phone is the source of truth)', async () => {
    await insertTransaction(db, tx('t1'));
    await runSync(db, api);
    api.transactions.clear(); // e.g. the server data file was reset
    await runSync(db, api);
    expect(await statusOf('t1')).toBe('pending');
    await runSync(db, api);
    expect(api.transactions.has('t1')).toBe(true);
    expect(await statusOf('t1')).toBe('synced');
  });

  it('pulls categories and budgets too, and skips a record that conflicts locally instead of failing', async () => {
    await insertCategory(db, category('mine', 'Gifts'));
    api.rejectIds.add('mine'); // keeps the local one pending
    api.categories.set('theirs', { ...category('theirs', 'gifts'), createdAt: 'n', updatedAt: 'n' } as never);
    api.budgets.set('sb', { id: 'sb', categoryId: 'cat_bills', amountMinor: 5000, currency: 'XOF', month: '2026-11', createdAt: 'n', updatedAt: 'n' });
    const result = await runSync(db, api);

    expect(result.outcome).toBe('synced');
    expect(result.skipped).toBe(1); // "gifts" clashes with the local "Gifts"
    expect((await getAllBudgets(db)).map((b) => b.id)).toEqual(['sb']);
    expect((await getAllCategories(db)).some((c) => c.id === 'theirs')).toBe(false);
  });
});
