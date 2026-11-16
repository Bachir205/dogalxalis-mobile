import type { Db } from '../types';

export interface DemoCounts {
  transactions: number;
  budgets: number;
}

/** How many sample records exist (deleted ones are not counted). */
export async function countDemo(db: Db): Promise<DemoCounts> {
  const row = await db.getFirstAsync<DemoCounts>(
    `SELECT
       (SELECT COUNT(*) FROM transactions WHERE is_demo = 1 AND deleted_at IS NULL) AS transactions,
       (SELECT COUNT(*) FROM budgets      WHERE is_demo = 1 AND deleted_at IS NULL) AS budgets`,
    [],
  );
  return { transactions: row?.transactions ?? 0, budgets: row?.budgets ?? 0 };
}

/**
 * Removes every sample record with a soft delete (the synchronization then deletes them on the
 * server too). Only rows marked as demo are touched: the user's own data is never affected.
 */
export async function softDeleteDemo(db: Db, now: string): Promise<DemoCounts> {
  const removed: DemoCounts = { transactions: 0, budgets: 0 };
  await db.withTransactionAsync(async () => {
    const transactions = await db.runAsync(
      `UPDATE transactions SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
       WHERE is_demo = 1 AND deleted_at IS NULL`,
      [now, now],
    );
    const budgets = await db.runAsync(
      `UPDATE budgets SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
       WHERE is_demo = 1 AND deleted_at IS NULL`,
      [now, now],
    );
    removed.transactions = transactions.changes;
    removed.budgets = budgets.changes;
  });
  return removed;
}
