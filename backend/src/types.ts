export type EntryType = 'income' | 'expense';
export type CurrencyCode = 'XOF' | 'EUR' | 'USD';

export interface Category {
  id: string;
  name: string;
  type: EntryType;
  icon: string;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  title: string;
  amountMinor: number;
  currency: CurrencyCode;
  type: EntryType;
  categoryId: string;
  description: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  amountMinor: number;
  currency: CurrencyCode;
  month: string;
  createdAt: string;
  updatedAt: string;
}

export interface Data {
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
}
