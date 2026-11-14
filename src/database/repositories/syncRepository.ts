import type { Budget, Category, SyncStatus, Transaction } from '@/types';
import type { ApiBudget, ApiCategory, ApiTransaction } from '@/validation/apiSchemas';

import type { Db } from '../types';

import { toBudget, type BudgetRow } from './budgetRepository';
import { toCategory, type CategoryRow } from './categoryRepository';
import { toTransaction, type TransactionRow } from './transactionRepository';

/** SQL used only by the synchronization. Table names below are constants, never user input. */
export type SyncTable = 'categories' | 'transactions' | 'budgets';

export interface PendingRecord<T> {
  record: T;
  /** True when the user deleted it locally and the server has not been told yet. */
  deleted: boolean;
}

export interface SyncState {
  syncStatus: SyncStatus;
  deleted: boolean;
}

/** Rows waiting to be sent: pending (never sent, or edited, or network failure) and failed (rejected earlier). */
const WAITING = "sync_status IN ('pending', 'failed')";

export async function getPendingCategories(db: Db): Promise<Category[]> {
  const rows = await db.getAllAsync<CategoryRow>(
    `SELECT * FROM categories WHERE ${WAITING} ORDER BY created_at`,
    [],
  );
  return rows.map(toCategory);
}

export async function getPendingBudgets(db: Db): Promise<PendingRecord<Budget>[]> {
  const rows = await db.getAllAsync<BudgetRow & { deleted_at: string | null }>(
    `SELECT * FROM budgets WHERE ${WAITING} ORDER BY created_at`,
    [],
  );
  return rows.map((row) => ({ record: toBudget(row), deleted: row.deleted_at !== null }));
}

export async function getPendingTransactions(db: Db): Promise<PendingRecord<Transaction>[]> {
  const rows = await db.getAllAsync<TransactionRow & { deleted_at: string | null }>(
    `SELECT * FROM transactions WHERE ${WAITING} ORDER BY created_at`,
    [],
  );
  return rows.map((row) => ({ record: toTransaction(row), deleted: row.deleted_at !== null }));
}

/**
 * The server accepted the row. Only marks it synced if it has NOT been edited since it was sent
 * (same updated_at): an edit made while the request was in flight stays pending.
 */
export async function markSynced(db: Db, table: SyncTable, id: string, sentUpdatedAt: string): Promise<void> {
  await db.runAsync(`UPDATE ${table} SET sync_status = 'synced' WHERE id = ? AND updated_at = ?`, [id, sentUpdatedAt]);
}

/** The server refused the row (4xx). Same guard as markSynced. */
export async function markFailed(db: Db, table: SyncTable, id: string, sentUpdatedAt: string): Promise<void> {
  await db.runAsync(`UPDATE ${table} SET sync_status = 'failed' WHERE id = ? AND updated_at = ?`, [id, sentUpdatedAt]);
}

/** The server confirmed a delete (204, or 404 = already gone): remove the row for good. */
export async function purgeDeleted(db: Db, table: 'transactions' | 'budgets', id: string, sentUpdatedAt: string): Promise<void> {
  await db.runAsync(`DELETE FROM ${table} WHERE id = ? AND deleted_at IS NOT NULL AND updated_at = ?`, [id, sentUpdatedAt]);
}

/** The server no longer has a row we believed was synced: send it again. */
export async function markPending(db: Db, table: SyncTable, id: string): Promise<void> {
  await db.runAsync(`UPDATE ${table} SET sync_status = 'pending' WHERE id = ?`, [id]);
}

/** id -> sync state of every local row (including rows deleted locally and waiting to be purged). */
export async function getSyncStates(db: Db, table: SyncTable): Promise<Map<string, SyncState>> {
  const sql =
    table === 'categories'
      ? 'SELECT id, sync_status, 0 AS deleted FROM categories'
      : `SELECT id, sync_status, deleted_at IS NOT NULL AS deleted FROM ${table}`;
  const rows = await db.getAllAsync<{ id: string; sync_status: SyncStatus; deleted: number }>(sql, []);
  return new Map(rows.map((row) => [row.id, { syncStatus: row.sync_status, deleted: row.deleted === 1 }]));
}

export async function upsertCategoryFromServer(db: Db, item: ApiCategory): Promise<void> {
  await db.runAsync(
    `INSERT INTO categories (id, name, type, icon, color, created_at, updated_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'synced')
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name, icon = excluded.icon, color = excluded.color,
       updated_at = excluded.updated_at, sync_status = 'synced'`,
    [item.id, item.name, item.type, item.icon, item.color, item.createdAt, item.updatedAt],
  );
}

export async function upsertBudgetFromServer(db: Db, item: ApiBudget): Promise<void> {
  await db.runAsync(
    `INSERT INTO budgets (id, category_id, amount_minor, currency, month, created_at, updated_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'synced')
     ON CONFLICT(id) DO UPDATE SET
       category_id = excluded.category_id, amount_minor = excluded.amount_minor,
       currency = excluded.currency, month = excluded.month,
       updated_at = excluded.updated_at, sync_status = 'synced'`,
    [item.id, item.categoryId, item.amountMinor, item.currency, item.month, item.createdAt, item.updatedAt],
  );
}

export async function upsertTransactionFromServer(db: Db, item: ApiTransaction): Promise<void> {
  await db.runAsync(
    `INSERT INTO transactions
       (id, title, amount_minor, currency, type, category_id, description, occurred_at, created_at, updated_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')
     ON CONFLICT(id) DO UPDATE SET
       title = excluded.title, amount_minor = excluded.amount_minor, currency = excluded.currency,
       type = excluded.type, category_id = excluded.category_id, description = excluded.description,
       occurred_at = excluded.occurred_at, updated_at = excluded.updated_at, sync_status = 'synced'`,
    [
      item.id, item.title, item.amountMinor, item.currency, item.type, item.categoryId,
      item.description, item.date, item.createdAt, item.updatedAt,
    ],
  );
}

export interface UnsyncedCounts {
  /** Waiting to be sent. */
  pending: number;
  /** Refused by the server. */
  failed: number;
}

export async function countUnsynced(db: Db): Promise<UnsyncedCounts> {
  const row = await db.getFirstAsync<{ pending: number; failed: number }>(
    `SELECT
       (SELECT COUNT(*) FROM categories   WHERE sync_status = 'pending')
     + (SELECT COUNT(*) FROM transactions WHERE sync_status = 'pending')
     + (SELECT COUNT(*) FROM budgets      WHERE sync_status = 'pending') AS pending,
       (SELECT COUNT(*) FROM categories   WHERE sync_status = 'failed')
     + (SELECT COUNT(*) FROM transactions WHERE sync_status = 'failed')
     + (SELECT COUNT(*) FROM budgets      WHERE sync_status = 'failed') AS failed`,
    [],
  );
  return { pending: row?.pending ?? 0, failed: row?.failed ?? 0 };
}
