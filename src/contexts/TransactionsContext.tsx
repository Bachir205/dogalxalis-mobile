import {
  createContext,
  useCallback,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';

import {
  initialTransactionsState,
  transactionsReducer,
} from '@/reducers/transactionsReducer';
import type { LoadStatus, NewTransactionInput, Transaction } from '@/types';
import { generateId } from '@/utils/id';

export interface TransactionsContextValue {
  transactions: Transaction[];
  status: LoadStatus;
  error: string | null;
  addTransaction: (input: NewTransactionInput) => Promise<Transaction>;
  updateTransaction: (id: string, changes: Partial<NewTransactionInput>) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
}

export const TransactionsContext = createContext<TransactionsContextValue | null>(null);

/**
 * Phase 3: state only (in memory). Phase 4 makes these actions write to SQLite first,
 * Phase 6 adds the API. The functions are already async so their signature will not change.
 */
export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(transactionsReducer, initialTransactionsState);

  // dispatch never changes, so these functions keep the same identity for the whole app life.
  const addTransaction = useCallback(async (input: NewTransactionInput) => {
    const now = new Date().toISOString();
    const item: Transaction = {
      ...input,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
    };
    dispatch({ type: 'ADDED', item });
    return item;
  }, []);

  const updateTransaction = useCallback(
    async (id: string, changes: Partial<NewTransactionInput>) => {
      dispatch({ type: 'UPDATED', id, changes, updatedAt: new Date().toISOString() });
    },
    [],
  );

  const removeTransaction = useCallback(async (id: string) => {
    dispatch({ type: 'REMOVED', id });
  }, []);

  const value = useMemo<TransactionsContextValue>(
    () => ({
      transactions: state.items,
      status: state.status,
      error: state.error,
      addTransaction,
      updateTransaction,
      removeTransaction,
    }),
    [state, addTransaction, updateTransaction, removeTransaction],
  );

  return <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>;
}
