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
import { generateId } from '@/utils/id';

export interface CategoriesContextValue {
  categories: Category[];
  categoriesById: Record<string, Category>;
  status: LoadStatus;
  error: string | null;
  addCategory: (input: NewCategoryInput) => Promise<Category>;
  updateCategory: (id: string, changes: CategoryChanges) => Promise<void>;
  refresh: () => Promise<void>;
}

export const CategoriesContext = createContext<CategoriesContextValue | null>(null);

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const db = useDatabase();
  const [state, dispatch] = useReducer(categoriesReducer, initialCategoriesState);

  const refresh = useCallback(async () => {
    dispatch({ type: 'LOAD_START' });
    try {
      dispatch({ type: 'LOAD_SUCCESS', items: await getAllCategories(db) });
    } catch (error) {
      dispatch({ type: 'LOAD_FAILURE', error: error instanceof Error ? error.message : 'load failed' });
    }
  }, [db]);

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
      return item;
    },
    [db],
  );

  const updateCategory = useCallback(
    async (id: string, changes: CategoryChanges) => {
      const now = new Date().toISOString();
      await updateCategoryRow(db, id, changes, now);
      dispatch({ type: 'UPDATED', id, changes, updatedAt: now });
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
    }),
    [state, categoriesById, addCategory, updateCategory, refresh],
  );

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}
