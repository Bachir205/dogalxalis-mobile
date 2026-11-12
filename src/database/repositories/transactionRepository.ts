import type { CurrencyCode } from '@/constants/currencies';
import type { NewTransactionInput, SyncStatus, Transaction, TransactionType } from '@/types';

import { DataError } from '../errors';
import type { Db, SqlParams } from '../types';

interface TransactionRow {
  id: string;
  title: string;
  amount_minor: number;
  currency: CurrencyCode;
  type: TransactionType;
  category_id: string;
  description: string | null;
  occurred_at: string;
  created_at: string;
  updated_at: string;
  sync_status: SyncStatus;
}

function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    title: row.title,
    amountMinor: row.amount_minor,
    currency: row.currency,
    type: row.type,
    categoryId: row.category_id,
    description: row.description,
    date: row.occurred_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
  };
}

/** Business rule: the category must exist and have the same type as the transaction. */
async function assertCategoryMatches(db: Db, categoryId: string, type: TransactionType) {
  const category = await db.getFirstAsync<{ type: TransactionType }>(
    'SELECT type FROM categories WHERE id = ?',
    [categoryId],
  );
  if (!category) throw new DataError('CATEGORY_NOT_FOUND');
  if (category.type !== type) throw new DataError('CATEGORY_TYPE_MISMATCH');
}

/** Newest first. Deleted (soft-deleted) rows are never returned. */
export async function getAllTransactions(db: Db): Promise<Transaction[]> {
  const rows = await db.getAllAsync<TransactionRow>(
    `SELECT * FROM transactions
     WHERE deleted_at IS NULL
     ORDER BY occurred_at DESC, created_at DESC`,
    [],
  );
  return rows.map(toTransaction);
}

export async function getTransactionById(db: Db, id: string): Promise<Transaction | null> {
  const row = await db.getFirstAsync<TransactionRow>(
    'SELECT * FROM transactions WHERE id = ? AND deleted_at IS NULL',
    [id],
  );
  return row ? toTransaction(row) : null;
}

export async function insertTransaction(db: Db, transaction: Transaction): Promise<void> {
  await assertCategoryMatches(db, transaction.categoryId, transaction.type);
  await db.runAsync(
    `INSERT INTO transactions
       (id, title, amount_minor, currency, type, category_id, description,
        occurred_at, created_at, updated_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      transaction.id,
      transaction.title,
      transaction.amountMinor,
      transaction.currency,
      transaction.type,
      transaction.categoryId,
      transaction.description,
      transaction.date,
      transaction.createdAt,
      transaction.updatedAt,
      transaction.syncStatus,
    ],
  );
}

const COLUMN_FOR_FIELD: Record<keyof NewTransactionInput, string> = {
  title: 'title',
  amountMinor: 'amount_minor',
  currency: 'currency',
  type: 'type',
  categoryId: 'category_id',
  description: 'description',
  date: 'occurred_at',
};

/** Updates only the given fields, re-checks the category rule, marks the row as pending. */
export async function updateTransaction(
  db: Db,
  id: string,
  changes: Partial<NewTransactionInput>,
  updatedAt: string,
): Promise<void> {
  const existing = await getTransactionById(db, id);
  if (!existing) throw new DataError('NOT_FOUND', `Transaction ${id} not found`);

  const finalType = changes.type ?? existing.type;
  const finalCategory = changes.categoryId ?? existing.categoryId;
  await assertCategoryMatches(db, finalCategory, finalType);

  const sets: string[] = [];
  const params: SqlParams = [];
  for (const field of Object.keys(COLUMN_FOR_FIELD) as (keyof NewTransactionInput)[]) {
    const value = changes[field];
    if (value !== undefined) {
      sets.push(`${COLUMN_FOR_FIELD[field]} = ?`);
      params.push(value);
    }
  }
  sets.push('updated_at = ?', "sync_status = 'pending'");
  params.push(updatedAt, id);

  await db.runAsync(
    `UPDATE transactions SET ${sets.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
    params,
  );
}

/**
 * Soft delete: the row stays (with deleted_at set) until the API has been told, so a delete
 * made offline is never lost. Every read excludes it, so totals and budgets ignore it at once.
 */
export async function softDeleteTransaction(db: Db, id: string, now: string): Promise<void> {
  const result = await db.runAsync(
    `UPDATE transactions
     SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
     WHERE id = ? AND deleted_at IS NULL`,
    [now, now, id],
  );
  if (result.changes === 0) throw new DataError('NOT_FOUND', `Transaction ${id} not found`);
}
