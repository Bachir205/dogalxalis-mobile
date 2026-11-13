import type { CurrencyCode } from '@/constants/currencies';
import type { Budget, Transaction } from '@/types';

export type BudgetStatus = 'normal' | 'approaching' | 'reached' | 'exceeded';

/** From this share of the limit on, a budget is "approaching its limit". */
export const APPROACHING_PERCENT = 80;

export interface BudgetSummary {
  budget: Budget;
  spentMinor: number;
  /** limit - spent. Negative when the budget is exceeded. */
  remainingMinor: number;
  /** How far over the limit (0 when not exceeded). */
  exceededMinor: number;
  /** Real percentage, rounded down, NOT capped (150 when spent is 1.5 x the limit). */
  progressPercent: number;
  /** Percentage for the progress bar: the real one, capped at 100. */
  barPercent: number;
  status: BudgetStatus;
}

export interface BudgetTotals {
  allocatedMinor: number;
  spentMinor: number;
  remainingMinor: number;
  count: number;
}

/**
 * Spent = sum of the EXPENSE transactions of the budget's category, in the budget's month and
 * currency. Income and other categories, months or currencies never count. Deleted
 * transactions are not in the list at all. Nothing is stored: it is always recomputed.
 */
export function computeSpentMinor(
  transactions: readonly Transaction[],
  budget: Pick<Budget, 'categoryId' | 'month' | 'currency'>,
): number {
  let spent = 0;
  for (const transaction of transactions) {
    if (
      transaction.type === 'expense' &&
      transaction.categoryId === budget.categoryId &&
      transaction.currency === budget.currency &&
      transaction.date.slice(0, 7) === budget.month
    ) {
      spent += transaction.amountMinor;
    }
  }
  return spent;
}

/** Status thresholds, compared with integers only (no floating-point rounding surprises). */
export function getBudgetStatus(spentMinor: number, limitMinor: number): BudgetStatus {
  if (limitMinor <= 0) return 'normal'; // defensive: creation rejects a zero limit
  if (spentMinor > limitMinor) return 'exceeded';
  if (spentMinor === limitMinor) return 'reached';
  if (spentMinor * 100 >= limitMinor * APPROACHING_PERCENT) return 'approaching';
  return 'normal';
}

export function computeBudgetSummary(
  budget: Budget,
  transactions: readonly Transaction[],
): BudgetSummary {
  const spentMinor = computeSpentMinor(transactions, budget);
  const limit = budget.amountMinor;
  // Rounded DOWN so 99.6% never reads "100%" while the status is still "approaching".
  const progressPercent = limit > 0 ? Math.floor((spentMinor * 100) / limit) : 0;
  return {
    budget,
    spentMinor,
    remainingMinor: limit - spentMinor,
    exceededMinor: Math.max(0, spentMinor - limit),
    progressPercent,
    barPercent: Math.min(100, progressPercent),
    status: getBudgetStatus(spentMinor, limit),
  };
}

export interface BudgetScope {
  /** YYYY-MM */
  month: string;
  currency: CurrencyCode;
}

/** Summaries of the budgets of one month and currency, the most consumed budget first. */
export function computeBudgetSummaries(
  budgets: readonly Budget[],
  transactions: readonly Transaction[],
  scope: BudgetScope,
): BudgetSummary[] {
  return budgets
    .filter((budget) => budget.month === scope.month && budget.currency === scope.currency)
    .map((budget) => computeBudgetSummary(budget, transactions))
    .sort(
      (a, b) =>
        b.progressPercent - a.progressPercent ||
        b.spentMinor - a.spentMinor ||
        a.budget.categoryId.localeCompare(b.budget.categoryId),
    );
}

export function computeBudgetTotals(summaries: readonly BudgetSummary[]): BudgetTotals {
  let allocatedMinor = 0;
  let spentMinor = 0;
  for (const summary of summaries) {
    allocatedMinor += summary.budget.amountMinor;
    spentMinor += summary.spentMinor;
  }
  return { allocatedMinor, spentMinor, remainingMinor: allocatedMinor - spentMinor, count: summaries.length };
}
