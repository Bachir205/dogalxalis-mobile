import type { Budget, Transaction } from '@/types';
import {
  computeBudgetSummaries,
  computeBudgetSummary,
  computeBudgetTotals,
  computeSpentMinor,
  getBudgetStatus,
} from '@/utils/budgetCalculations';

let counter = 0;
const tx = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: `t${++counter}`,
  title: 'Item',
  amountMinor: 1000,
  currency: 'XOF',
  type: 'expense',
  categoryId: 'cat_food',
  description: null,
  date: '2026-11-15',
  createdAt: '2026-11-15T08:00:00.000Z',
  updatedAt: '2026-11-15T08:00:00.000Z',
  syncStatus: 'pending',
  ...overrides,
});

const budget = (overrides: Partial<Budget> = {}): Budget => ({
  id: `b${++counter}`,
  categoryId: 'cat_food',
  amountMinor: 10000,
  currency: 'XOF',
  month: '2026-11',
  createdAt: 'n',
  updatedAt: 'n',
  syncStatus: 'pending',
  ...overrides,
});

describe('computeSpentMinor: which transactions count', () => {
  const food = budget();

  it('adds up the expenses of the budget category, month and currency', () => {
    const data = [tx({ amountMinor: 1000 }), tx({ amountMinor: 2500 })];
    expect(computeSpentMinor(data, food)).toBe(3500);
  });

  it('ignores income, even in the same category', () => {
    expect(computeSpentMinor([tx({ type: 'income', amountMinor: 99999 })], food)).toBe(0);
  });

  it('ignores other categories', () => {
    expect(computeSpentMinor([tx({ categoryId: 'cat_transport', amountMinor: 5000 })], food)).toBe(0);
  });

  it('ignores other currencies', () => {
    expect(computeSpentMinor([tx({ currency: 'EUR', amountMinor: 5000 })], food)).toBe(0);
  });

  it('counts the first and last day of the month, and nothing from the neighbouring months', () => {
    const data = [
      tx({ date: '2026-11-01', amountMinor: 1 }),
      tx({ date: '2026-11-30', amountMinor: 10 }),
      tx({ date: '2026-10-31', amountMinor: 100 }),
      tx({ date: '2026-12-01', amountMinor: 1000 }),
    ];
    expect(computeSpentMinor(data, food)).toBe(11);
  });

  it('does not count a deleted transaction (it is no longer in the list)', () => {
    const kept = tx({ amountMinor: 1000 });
    const deleted = tx({ amountMinor: 4000 });
    expect(computeSpentMinor([kept, deleted], food)).toBe(5000);
    expect(computeSpentMinor([kept], food)).toBe(1000);
  });
});

describe('getBudgetStatus: thresholds are exact', () => {
  it('is normal below 80%', () => {
    expect(getBudgetStatus(0, 10000)).toBe('normal');
    expect(getBudgetStatus(7999, 10000)).toBe('normal');
  });

  it('is approaching from exactly 80% up to (but not including) 100%', () => {
    expect(getBudgetStatus(8000, 10000)).toBe('approaching');
    expect(getBudgetStatus(9999, 10000)).toBe('approaching');
  });

  it('is reached at exactly 100%', () => {
    expect(getBudgetStatus(10000, 10000)).toBe('reached');
  });

  it('is exceeded above 100%', () => {
    expect(getBudgetStatus(10001, 10000)).toBe('exceeded');
    expect(getBudgetStatus(25000, 10000)).toBe('exceeded');
  });

  it('uses integer arithmetic for limits where 80% is not a whole number', () => {
    expect(getBudgetStatus(2, 3)).toBe('normal'); // 66%
    expect(getBudgetStatus(4, 5)).toBe('approaching'); // exactly 80%
    expect(getBudgetStatus(3, 7)).toBe('normal'); // 42%
    expect(getBudgetStatus(6, 7)).toBe('approaching'); // 85%
  });

  it('does not misbehave with a zero limit', () => {
    expect(getBudgetStatus(0, 0)).toBe('normal');
    expect(getBudgetStatus(500, 0)).toBe('normal');
  });
});

describe('computeBudgetSummary', () => {
  const summaryFor = (spent: number, limit = 10000) =>
    computeBudgetSummary(budget({ amountMinor: limit }), spent > 0 ? [tx({ amountMinor: spent })] : []);

  it('computes spent, remaining and progress (the Food example: 65 000 of 100 000)', () => {
    const summary = summaryFor(65000, 100000);
    expect(summary).toMatchObject({
      spentMinor: 65000,
      remainingMinor: 35000,
      exceededMinor: 0,
      progressPercent: 65,
      barPercent: 65,
      status: 'normal',
    });
  });

  it('rounds the percentage down, so 99.6% is not shown as 100%', () => {
    const summary = summaryFor(9960);
    expect(summary.progressPercent).toBe(99);
    expect(summary.status).toBe('approaching');
  });

  it('keeps the real percentage and the exceeded amount above 100%, but caps the bar', () => {
    const summary = summaryFor(15000);
    expect(summary).toMatchObject({
      progressPercent: 150,
      barPercent: 100,
      remainingMinor: -5000,
      exceededMinor: 5000,
      status: 'exceeded',
    });
  });

  it('reports 100% and no excess when the budget is exactly reached', () => {
    expect(summaryFor(10000)).toMatchObject({
      progressPercent: 100,
      remainingMinor: 0,
      exceededMinor: 0,
      status: 'reached',
    });
  });

  it('handles a zero limit without dividing by zero', () => {
    const summary = computeBudgetSummary(budget({ amountMinor: 0 }), [tx({ amountMinor: 500 })]);
    expect(summary.progressPercent).toBe(0);
    expect(summary.barPercent).toBe(0);
  });

  it('stays exact with large amounts', () => {
    const limit = 900_000_000_000;
    const summary = computeBudgetSummary(budget({ amountMinor: limit }), [tx({ amountMinor: 450_000_000_000 })]);
    expect(summary.progressPercent).toBe(50);
    expect(summary.remainingMinor).toBe(450_000_000_000);
  });
});

describe('automatic recalculation (everything is derived from the transactions)', () => {
  const food = budget({ id: 'food', categoryId: 'cat_food' });
  const transport = budget({ id: 'transport', categoryId: 'cat_transport' });
  const scope = { month: '2026-11', currency: 'XOF' as const };
  const spent = (budgets: Budget[], data: Transaction[]) =>
    Object.fromEntries(computeBudgetSummaries(budgets, data, scope).map((s) => [s.budget.id, s.spentMinor]));

  it('creating an expense raises the matching budget only', () => {
    const lunch = tx({ amountMinor: 3000 });
    expect(spent([food, transport], [])).toEqual({ food: 0, transport: 0 });
    expect(spent([food, transport], [lunch])).toEqual({ food: 3000, transport: 0 });
  });

  it('editing the amount updates the budget', () => {
    const lunch = tx({ id: 'lunch', amountMinor: 3000 });
    expect(spent([food], [{ ...lunch, amountMinor: 7000 }])).toEqual({ food: 7000 });
  });

  it('changing the category moves the spending from the old budget to the new one', () => {
    const lunch = tx({ id: 'lunch', amountMinor: 3000 });
    expect(spent([food, transport], [lunch])).toEqual({ food: 3000, transport: 0 });
    expect(spent([food, transport], [{ ...lunch, categoryId: 'cat_transport' }])).toEqual({ food: 0, transport: 3000 });
  });

  it('changing the date to another month moves the spending to that month', () => {
    const lunch = tx({ id: 'lunch', amountMinor: 3000 });
    const october = budget({ id: 'oct', month: '2026-10' });
    const both = [food, october];
    const inNovember = computeBudgetSummaries(both, [lunch], scope);
    expect(inNovember.map((s) => [s.budget.id, s.spentMinor])).toEqual([['food', 3000]]);
    const moved = { ...lunch, date: '2026-10-20' };
    expect(spent(both, [moved])).toEqual({ food: 0 });
    expect(
      computeBudgetSummaries(both, [moved], { month: '2026-10', currency: 'XOF' }).map((s) => s.spentMinor),
    ).toEqual([3000]);
  });

  it('turning an expense into income, or deleting it, removes it from the budget', () => {
    const lunch = tx({ id: 'lunch', amountMinor: 3000 });
    expect(spent([food], [{ ...lunch, type: 'income' }])).toEqual({ food: 0 });
    expect(spent([food], [])).toEqual({ food: 0 });
  });

  it('an income never increases the spending', () => {
    const salary = tx({ type: 'income', categoryId: 'cat_food', amountMinor: 500000 });
    expect(spent([food], [salary])).toEqual({ food: 0 });
  });
});

describe('computeBudgetSummaries and computeBudgetTotals', () => {
  const scope = { month: '2026-11', currency: 'XOF' as const };

  it('keeps only the budgets of the month and currency, most consumed first', () => {
    const food = budget({ id: 'food', categoryId: 'cat_food', amountMinor: 10000 });
    const bills = budget({ id: 'bills', categoryId: 'cat_bills', amountMinor: 20000 });
    const old = budget({ id: 'old', month: '2026-10' });
    const euro = budget({ id: 'euro', currency: 'EUR' });
    const data = [
      tx({ categoryId: 'cat_food', amountMinor: 2000 }), // 20%
      tx({ categoryId: 'cat_bills', amountMinor: 19000 }), // 95%
    ];
    const summaries = computeBudgetSummaries([food, bills, old, euro], data, scope);
    expect(summaries.map((s) => s.budget.id)).toEqual(['bills', 'food']);
  });

  it('totals: allocated, spent, remaining and number of budgets', () => {
    const food = budget({ categoryId: 'cat_food', amountMinor: 10000 });
    const bills = budget({ categoryId: 'cat_bills', amountMinor: 20000 });
    const data = [
      tx({ categoryId: 'cat_food', amountMinor: 12000 }),
      tx({ categoryId: 'cat_bills', amountMinor: 5000 }),
      tx({ categoryId: 'cat_transport', amountMinor: 99999 }), // no budget: not part of the totals
    ];
    expect(computeBudgetTotals(computeBudgetSummaries([food, bills], data, scope))).toEqual({
      allocatedMinor: 30000,
      spentMinor: 17000,
      remainingMinor: 13000,
      count: 2,
    });
  });

  it('totals of nothing are zero', () => {
    expect(computeBudgetTotals([])).toEqual({ allocatedMinor: 0, spentMinor: 0, remainingMinor: 0, count: 0 });
  });
});
