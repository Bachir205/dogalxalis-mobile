import type { Budget, LoadStatus, NewBudgetInput, SyncStatus } from '@/types';
import { getCurrentMonth, isValidMonth, shiftMonth } from '@/utils/date';

export interface BudgetsState {
  items: Budget[];
  /** Month shown on the Budgets screen (YYYY-MM). */
  selectedMonth: string;
  status: LoadStatus;
  error: string | null;
}

export type BudgetsAction =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; items: Budget[] }
  | { type: 'LOAD_FAILURE'; error: string }
  | { type: 'ADDED'; item: Budget }
  | { type: 'UPDATED'; id: string; changes: Partial<NewBudgetInput>; updatedAt: string }
  | { type: 'REMOVED'; id: string }
  | { type: 'SELECT_MONTH'; month: string }
  | { type: 'SHIFT_MONTH'; delta: number }
  | { type: 'SYNC_STATUS_SET'; id: string; syncStatus: SyncStatus };

export function createInitialBudgetsState(now: Date = new Date()): BudgetsState {
  return { items: [], selectedMonth: getCurrentMonth(now), status: 'ready', error: null };
}

export function budgetsReducer(state: BudgetsState, action: BudgetsAction): BudgetsState {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, status: 'loading', error: null };
    case 'LOAD_SUCCESS':
      return { ...state, items: action.items, status: 'ready', error: null };
    case 'LOAD_FAILURE':
      return { ...state, status: 'error', error: action.error };
    case 'ADDED':
      return {
        ...state,
        items: [action.item, ...state.items.filter((item) => item.id !== action.item.id)],
      };
    case 'UPDATED':
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.id
            ? { ...item, ...action.changes, updatedAt: action.updatedAt, syncStatus: 'pending' }
            : item,
        ),
      };
    case 'REMOVED':
      return { ...state, items: state.items.filter((item) => item.id !== action.id) };
    case 'SELECT_MONTH':
      // An invalid month string is ignored rather than stored.
      return isValidMonth(action.month) ? { ...state, selectedMonth: action.month } : state;
    case 'SHIFT_MONTH':
      return { ...state, selectedMonth: shiftMonth(state.selectedMonth, action.delta) };
    case 'SYNC_STATUS_SET':
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.id ? { ...item, syncStatus: action.syncStatus } : item,
        ),
      };
  }
}
