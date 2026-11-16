import { runMigrations } from '@/database/migrations';
import { getAllBudgets, insertBudget } from '@/database/repositories/budgetRepository';
import { countDemo } from '@/database/repositories/demoRepository';
import { getAllTransactions, insertTransaction } from '@/database/repositories/transactionRepository';
import { loadDemoData, removeDemoData } from '@/services/demoData';
import { runSync } from '@/services/syncService';
import { getCurrentMonth, getToday } from '@/utils/date';

import { FakeApi } from '../setup/fakeApi';
import { createSqlJsDb, type SqlJsDb } from '../setup/sqlJsDatabase';

let db: SqlJsDb;
beforeEach(async () => {
  db = await createSqlJsDb();
  await runMigrations(db);
});

const options = { currency: 'XOF' as const, language: 'en' as const };

describe('loading the demo data', () => {
  it('stores marked transactions and budgets through the normal repositories', async () => {
    const result = await loadDemoData(db, options);
    expect(result).toMatchObject({ alreadyLoaded: false, added: { transactions: 15, budgets: 4 } });
    expect(await countDemo(db)).toEqual({ transactions: 15, budgets: 4 });
    expect((await getAllTransactions(db)).every((t) => t.isDemo)).toBe(true);
    expect((await getAllBudgets(db)).every((b) => b.isDemo)).toBe(true);
  });

  it('does nothing the second time (no duplicates)', async () => {
    await loadDemoData(db, options);
    const again = await loadDemoData(db, options);
    expect(again).toMatchObject({ alreadyLoaded: true, added: { transactions: 0, budgets: 0 } });
    expect(await countDemo(db)).toEqual({ transactions: 15, budgets: 4 });
  });

  it("skips a demo budget that would duplicate one of the user's own", async () => {
    await insertBudget(db, {
      id: 'mine', categoryId: 'cat_food', amountMinor: 1234, currency: 'XOF', month: getCurrentMonth(),
      createdAt: 'n', updatedAt: 'n', syncStatus: 'pending',
    });
    const result = await loadDemoData(db, options);
    expect(result.added).toEqual({ transactions: 15, budgets: 3 });
    const food = (await getAllBudgets(db)).find((b) => b.categoryId === 'cat_food');
    expect(food).toMatchObject({ id: 'mine', amountMinor: 1234, isDemo: false });
  });

  it('loads in the active currency', async () => {
    await loadDemoData(db, { currency: 'EUR', language: 'fr' });
    const all = await getAllTransactions(db);
    expect(all.every((t) => t.currency === 'EUR')).toBe(true);
    expect(all.find((t) => t.title === 'Courses')?.amountMinor).toBe(5800); // 58 EUR in cents
  });
});

describe('removing the demo data', () => {
  const userTransaction = {
    id: 'mine', title: 'My own lunch', amountMinor: 3000, currency: 'XOF' as const, type: 'expense' as const,
    categoryId: 'cat_food', description: null, date: getToday(), createdAt: 'n', updatedAt: 'n', syncStatus: 'pending' as const,
  };

  it('removes only the marked records and keeps the data of the user', async () => {
    await insertTransaction(db, userTransaction);
    await loadDemoData(db, options);
    const removed = await removeDemoData(db);
    expect(removed).toEqual({ transactions: 15, budgets: 4 });

    expect((await getAllTransactions(db)).map((t) => t.id)).toEqual(['mine']);
    expect(await getAllBudgets(db)).toEqual([]);
    expect(await countDemo(db)).toEqual({ transactions: 0, budgets: 0 });
  });

  it('is a soft delete, so the server can be told, and the demo data can be loaded again afterwards', async () => {
    await loadDemoData(db, options);
    await removeDemoData(db);
    const kept = await db.getFirstAsync<{ n: number }>(
      'SELECT COUNT(*) AS n FROM transactions WHERE is_demo = 1 AND deleted_at IS NOT NULL AND sync_status = \'pending\'',
      [],
    );
    expect(kept?.n).toBe(15);

    const again = await loadDemoData(db, options);
    expect(again.alreadyLoaded).toBe(false);
    expect(await countDemo(db)).toEqual({ transactions: 15, budgets: 4 });
  });

  it('removing when there is none is harmless', async () => {
    expect(await removeDemoData(db)).toEqual({ transactions: 0, budgets: 0 });
  });
});

describe('demo data and the server', () => {
  it('is sent to the server like any data, and removing it deletes it there too', async () => {
    const api = new FakeApi();
    await loadDemoData(db, options);
    const sent = await runSync(db, api);
    expect(sent).toMatchObject({ outcome: 'synced', rejected: 0, pushed: 19 });
    expect(api.transactions.size).toBe(15);
    expect(api.budgets.size).toBe(4);
    expect([...api.transactions.values()][0]).not.toHaveProperty('isDemo'); // the flag stays on the phone

    await removeDemoData(db);
    await runSync(db, api);
    expect(api.transactions.size).toBe(0);
    expect(api.budgets.size).toBe(0);
    expect(await countDemo(db)).toEqual({ transactions: 0, budgets: 0 });
  });
});
