import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';

import {
  getAllTransactions,
  insertTransaction,
  softDeleteTransaction,
  updateTransaction as updateTransactionRow,
} from '@/database/repositories/transactionRepository';
import { useDatabase } from '@/hooks/useDatabase';
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
  refresh: () => Promise<void>;
}

export const TransactionsContext = createContext<TransactionsContextValue | null>(null);

/**
 * Coordinates state and actions. The SQL lives in the repository; this provider writes to
 * SQLite first and updates the screen state only when that succeeded (Phase 6 adds the API).
 */
export function TransactionsProvider({ children }: { children: ReactNode }) {
  const db = useDatabase();
  const [state, dispatch] = useReducer(transactionsReducer, initialTransactionsState);

  const refresh = useCallback(async () => {
    dispatch({ type: 'LOAD_START' });
    try {
      dispatch({ type: 'LOAD_SUCCESS', items: await getAllTransactions(db) });
    } catch (error) {
      dispatch({ type: 'LOAD_FAILURE', error: error instanceof Error ? error.message : 'load failed' });
    }
  }, [db]);

  // Effect: show the saved transactions as soon as the database is available.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addTransaction = useCallback(
    async (input: NewTransactionInput) => {
      const now = new Date().toISOString();
      const item: Transaction = {
        ...input,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
        syncStatus: 'pending',
      };
      await insertTransaction(db, item);
      dispatch({ type: 'ADDED', item });
      return item;
    },
    [db],
  );

  const updateTransaction = useCallback(
    async (id: string, changes: Partial<NewTransactionInput>) => {
      const now = new Date().toISOString();
      await updateTransactionRow(db, id, changes, now);
      dispatch({ type: 'UPDATED', id, changes, updatedAt: now });
    },
    [db],
  );

  const removeTransaction = useCallback(
    async (id: string) => {
      await softDeleteTransaction(db, id, new Date().toISOString());
      dispatch({ type: 'REMOVED', id });
    },
    [db],
  );

  const value = useMemo<TransactionsContextValue>(
    () => ({
      transactions: state.items,
      status: state.status,
      error: state.error,
      addTransaction,
      updateTransaction,
      removeTransaction,
      refresh,
    }),
    [state, addTransaction, updateTransaction, removeTransaction, refresh],
  );

  return <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>;
}
