import type { LoadStatus, NewTransactionInput, SyncStatus, Transaction } from '@/types';

export interface TransactionsState {
  items: Transaction[];
  status: LoadStatus;
  error: string | null;
}

export type TransactionsAction =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; items: Transaction[] }
  | { type: 'LOAD_FAILURE'; error: string }
  | { type: 'ADDED'; item: Transaction }
  | { type: 'UPDATED'; id: string; changes: Partial<NewTransactionInput>; updatedAt: string }
  | { type: 'REMOVED'; id: string }
  | { type: 'SYNC_STATUS_SET'; id: string; syncStatus: SyncStatus };

/** Phase 3: nothing is loaded from a database yet, so the list starts empty and ready. */
export const initialTransactionsState: TransactionsState = {
  items: [],
  status: 'ready',
  error: null,
};

/** Pure function: (state, action) -> new state. Never mutates the previous state. */
export function transactionsReducer(
  state: TransactionsState,
  action: TransactionsAction,
): TransactionsState {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, status: 'loading', error: null };
    case 'LOAD_SUCCESS':
      return { items: action.items, status: 'ready', error: null };
    case 'LOAD_FAILURE':
      return { ...state, status: 'error', error: action.error };
    case 'ADDED':
      // Same id again (double tap, retry) replaces instead of duplicating.
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
    case 'SYNC_STATUS_SET':
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.id ? { ...item, syncStatus: action.syncStatus } : item,
        ),
      };
  }
}
