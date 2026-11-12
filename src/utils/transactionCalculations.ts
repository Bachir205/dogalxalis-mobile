import type { CurrencyCode } from '@/constants/currencies';
import type { Transaction } from '@/types';

/** Which transactions count: same currency, and (optionally) one calendar month (YYYY-MM). */
export interface CalculationScope {
  currency: CurrencyCode;
  month?: string | null;
}

export interface Totals {
  income: number;
  expenses: number;
  /** income - expenses (can be negative). */
  net: number;
  count: number;
}

function inScope(transaction: Transaction, scope: CalculationScope): boolean {
  if (transaction.currency !== scope.currency) return false;
  return !scope.month || transaction.date.slice(0, 7) === scope.month;
}

/** The single place where income, expenses and net are computed. */
export function computeTotals(transactions: readonly Transaction[], scope: CalculationScope): Totals {
  let income = 0;
  let expenses = 0;
  let count = 0;
  for (const transaction of transactions) {
    if (!inScope(transaction, scope)) continue;
    count += 1;
    if (transaction.type === 'income') income += transaction.amountMinor;
    else expenses += transaction.amountMinor;
  }
  return { income, expenses, net: income - expenses, count };
}

export interface CategorySpending {
  categoryId: string;
  totalMinor: number;
}

/** Expense totals per category, largest first (ties by category id, for a stable order). */
export function computeCategorySpending(
  transactions: readonly Transaction[],
  scope: CalculationScope,
): CategorySpending[] {
  const totals = new Map<string, number>();
  for (const transaction of transactions) {
    if (transaction.type !== 'expense' || !inScope(transaction, scope)) continue;
    totals.set(transaction.categoryId, (totals.get(transaction.categoryId) ?? 0) + transaction.amountMinor);
  }
  return [...totals.entries()]
    .map(([categoryId, totalMinor]) => ({ categoryId, totalMinor }))
    .sort((a, b) => b.totalMinor - a.totalMinor || a.categoryId.localeCompare(b.categoryId));
}

/** Newest first: by date, then by creation time, then by id. Does not change the input. */
export function sortTransactions(transactions: readonly Transaction[]): Transaction[] {
  return [...transactions].sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      b.createdAt.localeCompare(a.createdAt) ||
      b.id.localeCompare(a.id),
  );
}
