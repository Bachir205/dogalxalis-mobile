import {
  createContext,
  useCallback,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';

import { budgetsReducer, createInitialBudgetsState } from '@/reducers/budgetsReducer';
import type { Budget, LoadStatus, NewBudgetInput } from '@/types';
import { generateId } from '@/utils/id';

export interface BudgetsContextValue {
  budgets: Budget[];
  selectedMonth: string;
  status: LoadStatus;
  error: string | null;
  setSelectedMonth: (month: string) => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  createBudget: (input: NewBudgetInput) => Promise<Budget>;
  updateBudget: (id: string, changes: Partial<NewBudgetInput>) => Promise<void>;
  removeBudget: (id: string) => Promise<void>;
}

export const BudgetsContext = createContext<BudgetsContextValue | null>(null);

/**
 * Phase 3: state only (in memory). Phase 5 adds the rules (one budget per category, month and
 * currency), the spent / remaining calculations and the SQLite persistence.
 */
export function BudgetsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(budgetsReducer, undefined, () =>
    createInitialBudgetsState(),
  );

  const setSelectedMonth = useCallback(
    (month: string) => dispatch({ type: 'SELECT_MONTH', month }),
    [],
  );
  const goToPreviousMonth = useCallback(() => dispatch({ type: 'SHIFT_MONTH', delta: -1 }), []);
  const goToNextMonth = useCallback(() => dispatch({ type: 'SHIFT_MONTH', delta: 1 }), []);

  const createBudget = useCallback(async (input: NewBudgetInput) => {
    const now = new Date().toISOString();
    const item: Budget = {
      ...input,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
    };
    dispatch({ type: 'ADDED', item });
    return item;
  }, []);

  const updateBudget = useCallback(async (id: string, changes: Partial<NewBudgetInput>) => {
    dispatch({ type: 'UPDATED', id, changes, updatedAt: new Date().toISOString() });
  }, []);

  const removeBudget = useCallback(async (id: string) => {
    dispatch({ type: 'REMOVED', id });
  }, []);

  const value = useMemo<BudgetsContextValue>(
    () => ({
      budgets: state.items,
      selectedMonth: state.selectedMonth,
      status: state.status,
      error: state.error,
      setSelectedMonth,
      goToPreviousMonth,
      goToNextMonth,
      createBudget,
      updateBudget,
      removeBudget,
    }),
    [
      state,
      setSelectedMonth,
      goToPreviousMonth,
      goToNextMonth,
      createBudget,
      updateBudget,
      removeBudget,
    ],
  );

  return <BudgetsContext.Provider value={value}>{children}</BudgetsContext.Provider>;
}
