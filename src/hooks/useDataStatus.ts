import { useCallback } from 'react';

import { useBudgets } from './useBudgets';
import { useCategories } from './useCategories';
import { useTransactions } from './useTransactions';

export type DataStatus = 'loading' | 'error' | 'ready';

/**
 * One loading / error status for the screens that need categories, transactions and budgets
 * together, and one "Try again" that reloads all three. (A synchronization reloads silently, so
 * it never turns this back into "loading".)
 */
export function useDataStatus(): { status: DataStatus; refresh: () => Promise<void> } {
  const { status: categoriesStatus, refresh: refreshCategories } = useCategories();
  const { status: transactionsStatus, refresh: refreshTransactions } = useTransactions();
  const { status: budgetsStatus, refresh: refreshBudgets } = useBudgets();

  const all = [categoriesStatus, transactionsStatus, budgetsStatus];
  const status: DataStatus = all.includes('error')
    ? 'error'
    : all.some((item) => item === 'loading' || item === 'idle')
      ? 'loading'
      : 'ready';

  const refresh = useCallback(async () => {
    await Promise.all([refreshCategories(), refreshTransactions(), refreshBudgets()]);
  }, [refreshCategories, refreshTransactions, refreshBudgets]);

  return { status, refresh };
}
