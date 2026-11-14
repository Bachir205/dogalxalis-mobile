import type { CurrencyCode } from '@/constants/currencies';
import type { Budget, NewBudgetInput, SyncStatus } from '@/types';
import { isValidMonth } from '@/utils/date';

import { DataError } from '../errors';
import { assertCategoryOfType, isUniqueViolation } from '../rules';
import type { Db, SqlParams } from '../types';

export interface BudgetRow {
  id: string;
  category_id: string;
  amount_minor: number;
  currency: CurrencyCode;
  month: string;
  created_at: string;
  updated_at: string;
  sync_status: SyncStatus;
}

export function toBudget(row: BudgetRow): Budget {
  return {
    id: row.id,
    categoryId: row.category_id,
    amountMinor: row.amount_minor,
    currency: row.currency,
    month: row.month,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
  };
}

/** Newest month first. Deleted (soft-deleted) budgets are never returned. */
export async function getAllBudgets(db: Db): Promise<Budget[]> {
  const rows = await db.getAllAsync<BudgetRow>(
    'SELECT * FROM budgets WHERE deleted_at IS NULL ORDER BY month DESC, created_at DESC',
    [],
  );
  return rows.map(toBudget);
}

export async function getBudgetById(db: Db, id: string): Promise<Budget | null> {
  const row = await db.getFirstAsync<BudgetRow>(
    'SELECT * FROM budgets WHERE id = ? AND deleted_at IS NULL',
    [id],
  );
  return row ? toBudget(row) : null;
}

/** Budget rules: expense categories only, a real calendar month, one budget per category + month + currency. */
export async function insertBudget(db: Db, budget: Budget): Promise<void> {
  if (!isValidMonth(budget.month)) throw new DataError('INVALID_MONTH');
  await assertCategoryOfType(db, budget.categoryId, 'expense');
  try {
    await db.runAsync(
      `INSERT INTO budgets
         (id, category_id, amount_minor, currency, month, created_at, updated_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        budget.id,
        budget.categoryId,
        budget.amountMinor,
        budget.currency,
        budget.month,
        budget.createdAt,
        budget.updatedAt,
        budget.syncStatus,
      ],
    );
  } catch (error) {
    if (isUniqueViolation(error)) throw new DataError('DUPLICATE', 'A budget already exists');
    throw error;
  }
}

const COLUMN_FOR_FIELD: Record<keyof NewBudgetInput, string> = {
  categoryId: 'category_id',
  amountMinor: 'amount_minor',
  currency: 'currency',
  month: 'month',
};

/** Updates only the given fields, re-checks the rules, marks the row as pending. */
export async function updateBudget(
  db: Db,
  id: string,
  changes: Partial<NewBudgetInput>,
  updatedAt: string,
): Promise<void> {
  const existing = await getBudgetById(db, id);
  if (!existing) throw new DataError('NOT_FOUND', `Budget ${id} not found`);

  if (changes.month !== undefined && !isValidMonth(changes.month)) {
    throw new DataError('INVALID_MONTH');
  }
  await assertCategoryOfType(db, changes.categoryId ?? existing.categoryId, 'expense');

  const sets: string[] = [];
  const params: SqlParams = [];
  for (const field of Object.keys(COLUMN_FOR_FIELD) as (keyof NewBudgetInput)[]) {
    const value = changes[field];
    if (value !== undefined) {
      sets.push(`${COLUMN_FOR_FIELD[field]} = ?`);
      params.push(value);
    }
  }
  sets.push('updated_at = ?', "sync_status = 'pending'");
  params.push(updatedAt, id);

  try {
    await db.runAsync(`UPDATE budgets SET ${sets.join(', ')} WHERE id = ? AND deleted_at IS NULL`, params);
  } catch (error) {
    if (isUniqueViolation(error)) throw new DataError('DUPLICATE', 'A budget already exists');
    throw error;
  }
}

/** Soft delete (same rule as transactions): hidden at once, purged after the API confirmed it. */
export async function softDeleteBudget(db: Db, id: string, now: string): Promise<void> {
  const result = await db.runAsync(
    `UPDATE budgets
     SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
     WHERE id = ? AND deleted_at IS NULL`,
    [now, now, id],
  );
  if (result.changes === 0) throw new DataError('NOT_FOUND', `Budget ${id} not found`);
}
