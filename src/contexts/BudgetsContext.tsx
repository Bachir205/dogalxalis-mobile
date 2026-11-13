import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';

import {
  getAllBudgets,
  insertBudget,
  softDeleteBudget,
  updateBudget as updateBudgetRow,
} from '@/database/repositories/budgetRepository';
import { useDatabase } from '@/hooks/useDatabase';
import { usePreferences } from '@/hooks/usePreferences';
import { useTransactions } from '@/hooks/useTransactions';
import { budgetsReducer, createInitialBudgetsState } from '@/reducers/budgetsReducer';
import type { Budget, LoadStatus, NewBudgetInput } from '@/types';
import {
  computeBudgetSummaries,
  computeBudgetTotals,
  type BudgetSummary,
  type BudgetTotals,
} from '@/utils/budgetCalculations';
import { generateId } from '@/utils/id';

export interface BudgetsContextValue {
  /** Every active budget (all months and currencies). */
  budgets: Budget[];
  selectedMonth: string;
  /** Budgets of the selected month in the active currency, with spent / remaining / progress. */
  summaries: BudgetSummary[];
  totals: BudgetTotals;
  status: LoadStatus;
  error: string | null;
  setSelectedMonth: (month: string) => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  createBudget: (input: NewBudgetInput) => Promise<Budget>;
  updateBudget: (id: string, changes: Partial<NewBudgetInput>) => Promise<void>;
  removeBudget: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const BudgetsContext = createContext<BudgetsContextValue | null>(null);

/**
 * Budgets are stored in SQLite; "spent", "remaining" and "progress" are never stored. They are
 * recomputed from the transactions whenever budgets or transactions change, so adding,
 * editing or deleting an expense updates every budget on screen by itself.
 */
export function BudgetsProvider({ children }: { children: ReactNode }) {
  const db = useDatabase();
  const { transactions } = useTransactions();
  const { currency } = usePreferences();
  const [state, dispatch] = useReducer(budgetsReducer, undefined, () => createInitialBudgetsState());

  const refresh = useCallback(async () => {
    dispatch({ type: 'LOAD_START' });
    try {
      dispatch({ type: 'LOAD_SUCCESS', items: await getAllBudgets(db) });
    } catch (error) {
      dispatch({ type: 'LOAD_FAILURE', error: error instanceof Error ? error.message : 'load failed' });
    }
  }, [db]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setSelectedMonth = useCallback(
    (month: string) => dispatch({ type: 'SELECT_MONTH', month }),
    [],
  );
  const goToPreviousMonth = useCallback(() => dispatch({ type: 'SHIFT_MONTH', delta: -1 }), []);
  const goToNextMonth = useCallback(() => dispatch({ type: 'SHIFT_MONTH', delta: 1 }), []);

  // The database is written first; the screen state changes only if that succeeded.
  const createBudget = useCallback(
    async (input: NewBudgetInput) => {
      const now = new Date().toISOString();
      const item: Budget = { ...input, id: generateId(), createdAt: now, updatedAt: now, syncStatus: 'pending' };
      await insertBudget(db, item);
      dispatch({ type: 'ADDED', item });
      return item;
    },
    [db],
  );

  const updateBudget = useCallback(
    async (id: string, changes: Partial<NewBudgetInput>) => {
      const now = new Date().toISOString();
      await updateBudgetRow(db, id, changes, now);
      dispatch({ type: 'UPDATED', id, changes, updatedAt: now });
    },
    [db],
  );

  const removeBudget = useCallback(
    async (id: string) => {
      await softDeleteBudget(db, id, new Date().toISOString());
      dispatch({ type: 'REMOVED', id });
    },
    [db],
  );

  // useMemo: recomputed only when the budgets, the transactions, the month or the currency change.
  const summaries = useMemo(
    () => computeBudgetSummaries(state.items, transactions, { month: state.selectedMonth, currency }),
    [state.items, state.selectedMonth, transactions, currency],
  );
  const totals = useMemo(() => computeBudgetTotals(summaries), [summaries]);

  const value = useMemo<BudgetsContextValue>(
    () => ({
      budgets: state.items,
      selectedMonth: state.selectedMonth,
      summaries,
      totals,
      status: state.status,
      error: state.error,
      setSelectedMonth,
      goToPreviousMonth,
      goToNextMonth,
      createBudget,
      updateBudget,
      removeBudget,
      refresh,
    }),
    [
      state,
      summaries,
      totals,
      setSelectedMonth,
      goToPreviousMonth,
      goToNextMonth,
      createBudget,
      updateBudget,
      removeBudget,
      refresh,
    ],
  );

  return <BudgetsContext.Provider value={value}>{children}</BudgetsContext.Provider>;
}
