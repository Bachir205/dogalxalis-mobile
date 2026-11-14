import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';

import {
  getAllCategories,
  insertCategory,
  updateCategory as updateCategoryRow,
  type CategoryChanges,
} from '@/database/repositories/categoryRepository';
import { useDatabase } from '@/hooks/useDatabase';
import { categoriesReducer, initialCategoriesState } from '@/reducers/categoriesReducer';
import type { Category, LoadStatus, NewCategoryInput } from '@/types';
import { notifyLocalChange } from '@/services/syncEvents';
import { generateId } from '@/utils/id';

export interface CategoriesContextValue {
  categories: Category[];
  categoriesById: Record<string, Category>;
  status: LoadStatus;
  error: string | null;
  addCategory: (input: NewCategoryInput) => Promise<Category>;
  updateCategory: (id: string, changes: CategoryChanges) => Promise<void>;
  refresh: () => Promise<void>;
  /** Re-reads SQLite without showing the loading state (used after a synchronization). */
  reload: () => Promise<void>;
}

export const CategoriesContext = createContext<CategoriesContextValue | null>(null);

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const db = useDatabase();
  const [state, dispatch] = useReducer(categoriesReducer, initialCategoriesState);

  const load = useCallback(
    async (silent: boolean) => {
      // A silent reload (after a synchronization) keeps the screen as it is: no loading spinner.
      if (!silent) dispatch({ type: 'LOAD_START' });
      try {
        dispatch({ type: 'LOAD_SUCCESS', items: await getAllCategories(db) });
      } catch (error) {
        dispatch({ type: 'LOAD_FAILURE', error: error instanceof Error ? error.message : 'load failed' });
      }
    },
    [db],
  );
  const refresh = useCallback(() => load(false), [load]);
  const reload = useCallback(() => load(true), [load]);

  // Effect: load the saved categories as soon as the database is available.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // The database is written first; the screen state changes only if that succeeded.
  const addCategory = useCallback(
    async (input: NewCategoryInput) => {
      const now = new Date().toISOString();
      const item: Category = {
        ...input,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
        syncStatus: 'pending',
      };
      await insertCategory(db, item);
      dispatch({ type: 'ADDED', item });
      notifyLocalChange(); // tell the sync that something is waiting to be sent
      return item;
    },
    [db],
  );

  const updateCategory = useCallback(
    async (id: string, changes: CategoryChanges) => {
      const now = new Date().toISOString();
      await updateCategoryRow(db, id, changes, now);
      dispatch({ type: 'UPDATED', id, changes, updatedAt: now });
      notifyLocalChange();
    },
    [db],
  );

  // useMemo: the id lookup table is rebuilt only when the list changes.
  const categoriesById = useMemo(
    () => Object.fromEntries(state.items.map((category) => [category.id, category])),
    [state.items],
  );

  const value = useMemo<CategoriesContextValue>(
    () => ({
      categories: state.items,
      categoriesById,
      status: state.status,
      error: state.error,
      addCategory,
      updateCategory,
      refresh,
      reload,
    }),
    [state, categoriesById, addCategory, updateCategory, refresh, reload],
  );

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}
