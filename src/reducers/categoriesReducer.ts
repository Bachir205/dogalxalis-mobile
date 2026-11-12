import type { Category, LoadStatus, SyncStatus } from '@/types';

export interface CategoriesState {
  items: Category[];
  status: LoadStatus;
  error: string | null;
}

export type CategoriesAction =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; items: Category[] }
  | { type: 'LOAD_FAILURE'; error: string }
  | { type: 'ADDED'; item: Category }
  | {
      type: 'UPDATED';
      id: string;
      changes: { name?: string; icon?: string; color?: string | null };
      updatedAt: string;
    }
  | { type: 'SYNC_STATUS_SET'; id: string; syncStatus: SyncStatus };

export const initialCategoriesState: CategoriesState = { items: [], status: 'idle', error: null };

export function categoriesReducer(state: CategoriesState, action: CategoriesAction): CategoriesState {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, status: 'loading', error: null };
    case 'LOAD_SUCCESS':
      return { items: action.items, status: 'ready', error: null };
    case 'LOAD_FAILURE':
      return { ...state, status: 'error', error: action.error };
    case 'ADDED':
      return { ...state, items: [...state.items.filter((i) => i.id !== action.item.id), action.item] };
    case 'UPDATED':
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.id
            ? { ...item, ...action.changes, updatedAt: action.updatedAt, syncStatus: 'pending' }
            : item,
        ),
      };
    case 'SYNC_STATUS_SET':
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.id ? { ...item, syncStatus: action.syncStatus } : item,
        ),
      };
  }
}
