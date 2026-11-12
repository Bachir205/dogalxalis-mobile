import type { Transaction, TransactionType } from '@/types';

export interface TransactionFilters {
  search: string;
  type: 'all' | TransactionType;
  categoryId: string | null;
  /** YYYY-MM, or null for all dates. */
  month: string | null;
}

export const DEFAULT_FILTERS: TransactionFilters = {
  search: '',
  type: 'all',
  categoryId: null,
  month: null,
};

export function hasActiveFilters(filters: TransactionFilters): boolean {
  return (
    filters.search.trim() !== '' ||
    filters.type !== 'all' ||
    filters.categoryId !== null ||
    filters.month !== null
  );
}

/** Lower-case and accent-insensitive, so "dejeuner" finds "Déjeuner". */
function fold(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/** Pure function: the Transactions screen wraps it in useMemo. */
export function filterTransactions(
  transactions: readonly Transaction[],
  filters: TransactionFilters,
): Transaction[] {
  const query = fold(filters.search.trim());
  return transactions.filter((transaction) => {
    if (filters.type !== 'all' && transaction.type !== filters.type) return false;
    if (filters.categoryId !== null && transaction.categoryId !== filters.categoryId) return false;
    if (filters.month !== null && transaction.date.slice(0, 7) !== filters.month) return false;
    if (query === '') return true;
    return (
      fold(transaction.title).includes(query) ||
      fold(transaction.description ?? '').includes(query)
    );
  });
}
