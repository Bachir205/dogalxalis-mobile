import type { TransactionType } from '@/types';

import { DataError } from './errors';
import type { Db } from './types';

/**
 * Business rule shared by transactions and budgets: the category must exist and have the
 * required type (a transaction needs its own type, a budget needs 'expense').
 */
export async function assertCategoryOfType(
  db: Db,
  categoryId: string,
  type: TransactionType,
): Promise<void> {
  const category = await db.getFirstAsync<{ type: TransactionType }>(
    'SELECT type FROM categories WHERE id = ?',
    [categoryId],
  );
  if (!category) throw new DataError('CATEGORY_NOT_FOUND');
  if (category.type !== type) throw new DataError('CATEGORY_TYPE_MISMATCH');
}

/** True when SQLite refused a write because of a UNIQUE index or constraint. */
export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Error && /UNIQUE constraint failed/i.test(error.message);
}
