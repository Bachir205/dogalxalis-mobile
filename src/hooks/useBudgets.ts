import { useContext } from 'react';

import { BudgetsContext, type BudgetsContextValue } from '@/contexts/BudgetsContext';

import { requireContext } from './requireContext';

/** Budgets, the selected month and the budget actions. */
export function useBudgets(): BudgetsContextValue {
  return requireContext(useContext(BudgetsContext), 'useBudgets', 'BudgetsProvider');
}
