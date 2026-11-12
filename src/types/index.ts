import type { CurrencyCode } from '@/constants/currencies';

export type TransactionType = 'income' | 'expense';

/** pending = not yet confirmed by the server, failed = rejected by the server. */
export type SyncStatus = 'synced' | 'pending' | 'failed';

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string | null;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface Transaction {
  id: string;
  title: string;
  /** Integer minor units (XOF has none, EUR/USD are cents). Never a float. */
  amountMinor: number;
  currency: CurrencyCode;
  type: TransactionType;
  categoryId: string;
  description: string | null;
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface Budget {
  id: string;
  categoryId: string;
  amountMinor: number;
  currency: CurrencyCode;
  /** Calendar month, YYYY-MM. */
  month: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

/** The fields a user supplies when creating a transaction. */
export type NewTransactionInput = Pick<
  Transaction,
  'title' | 'amountMinor' | 'currency' | 'type' | 'categoryId' | 'description' | 'date'
>;

/** The fields a user supplies when creating a budget. */
export type NewBudgetInput = Pick<Budget, 'categoryId' | 'amountMinor' | 'currency' | 'month'>;

/** The fields a user supplies when creating a category. */
export type NewCategoryInput = Pick<Category, 'name' | 'type' | 'icon' | 'color'>;
