import { useMemo } from 'react';

import { computeBudgetSummaries, computeBudgetTotals } from '@/utils/budgetCalculations';

import { useBudgets } from './useBudgets';
import { usePreferences } from './usePreferences';
import { useTransactions } from './useTransactions';

/**
 * Budget summaries and totals for any month (the dashboard uses the current month, whatever
 * month the Budgets screen is showing). Same pure functions as the Budgets screen.
 */
export function useBudgetOverview(month: string) {
  const { budgets } = useBudgets();
  const { transactions } = useTransactions();
  const { currency } = usePreferences();

  return useMemo(() => {
    const summaries = computeBudgetSummaries(budgets, transactions, { month, currency });
    return { summaries, totals: computeBudgetTotals(summaries) };
  }, [budgets, transactions, month, currency]);
}
