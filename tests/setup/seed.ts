import { runMigrations } from '@/database/migrations';
import { insertBudget } from '@/database/repositories/budgetRepository';
import { insertTransaction } from '@/database/repositories/transactionRepository';
import type { Budget, Transaction } from '@/types';
import { getCurrentMonth, getToday } from '@/utils/date';

import { openDatabaseAsync } from './sqliteMock';

let seq = 0;

/** Puts a transaction straight into the database, as if it had been saved in an earlier session. */
export async function seedTransaction(overrides: Partial<Transaction> = {}) {
  const db = await openDatabaseAsync();
  await runMigrations(db);
  seq += 1;
  await insertTransaction(db, {
    id: `seed-tx-${seq}`,
    title: 'Lunch',
    amountMinor: 2500,
    currency: 'XOF',
    type: 'expense',
    categoryId: 'cat_food',
    description: null,
    date: getToday(),
    createdAt: `2026-11-10T08:00:${String(seq % 60).padStart(2, '0')}.000Z`,
    updatedAt: '2026-11-10T08:00:00.000Z',
    syncStatus: 'pending',
    ...overrides,
  });
}

/** Puts a budget straight into the database (current month, Food, 10 000 FCFA by default). */
export async function seedBudget(overrides: Partial<Budget> = {}) {
  const db = await openDatabaseAsync();
  await runMigrations(db);
  seq += 1;
  await insertBudget(db, {
    id: `seed-budget-${seq}`,
    categoryId: 'cat_food',
    amountMinor: 10000,
    currency: 'XOF',
    month: getCurrentMonth(),
    createdAt: `2026-11-10T09:00:${String(seq % 60).padStart(2, '0')}.000Z`,
    updatedAt: '2026-11-10T09:00:00.000Z',
    syncStatus: 'pending',
    ...overrides,
  });
}
