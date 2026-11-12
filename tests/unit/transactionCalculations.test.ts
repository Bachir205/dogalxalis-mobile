import type { Transaction } from '@/types';
import {
  computeCategorySpending,
  computeTotals,
  sortTransactions,
} from '@/utils/transactionCalculations';
import {
  DEFAULT_FILTERS,
  filterTransactions,
  hasActiveFilters,
} from '@/utils/transactionFilters';

let counter = 0;
const tx = (overrides: Partial<Transaction>): Transaction => ({
  id: `t${++counter}`,
  title: 'Item',
  amountMinor: 1000,
  currency: 'XOF',
  type: 'expense',
  categoryId: 'cat_food',
  description: null,
  date: '2026-11-10',
  createdAt: '2026-11-10T08:00:00.000Z',
  updatedAt: '2026-11-10T08:00:00.000Z',
  syncStatus: 'pending',
  ...overrides,
});

describe('computeTotals', () => {
  const data = [
    tx({ type: 'income', amountMinor: 100000, categoryId: 'cat_salary' }),
    tx({ type: 'expense', amountMinor: 30000 }),
    tx({ type: 'expense', amountMinor: 5000, date: '2026-10-31' }),
    tx({ type: 'expense', amountMinor: 7777, currency: 'EUR' }),
    tx({ type: 'income', amountMinor: 999, currency: 'EUR', categoryId: 'cat_salary' }),
  ];

  it('computes income, expenses, net and count for one currency over all time', () => {
    expect(computeTotals(data, { currency: 'XOF' })).toEqual({
      income: 100000,
      expenses: 35000,
      net: 65000,
      count: 3,
    });
  });

  it('can be limited to one calendar month', () => {
    expect(computeTotals(data, { currency: 'XOF', month: '2026-11' })).toEqual({
      income: 100000,
      expenses: 30000,
      net: 70000,
      count: 2,
    });
    expect(computeTotals(data, { currency: 'XOF', month: '2026-10' }).expenses).toBe(5000);
    expect(computeTotals(data, { currency: 'XOF', month: '2026-09' })).toEqual({
      income: 0,
      expenses: 0,
      net: 0,
      count: 0,
    });
  });

  it('never mixes currencies', () => {
    expect(computeTotals(data, { currency: 'EUR' })).toEqual({
      income: 999,
      expenses: 7777,
      net: -6778,
      count: 2,
    });
  });

  it('returns zeros for no transactions and lets net go negative', () => {
    expect(computeTotals([], { currency: 'XOF' })).toEqual({ income: 0, expenses: 0, net: 0, count: 0 });
    expect(computeTotals([tx({ amountMinor: 500 })], { currency: 'XOF' }).net).toBe(-500);
  });

  it('changes when a transaction is edited or removed', () => {
    const base = [tx({ id: 'a', amountMinor: 1000 }), tx({ id: 'b', amountMinor: 2000 })];
    expect(computeTotals(base, { currency: 'XOF' }).expenses).toBe(3000);
    const edited = base.map((t) => (t.id === 'a' ? { ...t, amountMinor: 4000 } : t));
    expect(computeTotals(edited, { currency: 'XOF' }).expenses).toBe(6000);
    expect(computeTotals(edited.filter((t) => t.id !== 'b'), { currency: 'XOF' }).expenses).toBe(4000);
  });
});

describe('computeCategorySpending', () => {
  it('sums expenses per category, largest first, ignoring income, other months and currencies', () => {
    const data = [
      tx({ categoryId: 'cat_food', amountMinor: 1000 }),
      tx({ categoryId: 'cat_food', amountMinor: 2000 }),
      tx({ categoryId: 'cat_bills', amountMinor: 9000 }),
      tx({ categoryId: 'cat_transport', amountMinor: 3000 }),
      tx({ categoryId: 'cat_transport', amountMinor: 3000, date: '2026-10-01' }),
      tx({ type: 'income', categoryId: 'cat_salary', amountMinor: 500000 }),
      tx({ categoryId: 'cat_food', amountMinor: 1, currency: 'EUR' }),
    ];
    expect(computeCategorySpending(data, { currency: 'XOF', month: '2026-11' })).toEqual([
      { categoryId: 'cat_bills', totalMinor: 9000 },
      { categoryId: 'cat_food', totalMinor: 3000 },
      { categoryId: 'cat_transport', totalMinor: 3000 },
    ]);
    // Over all months, October's transport expense counts too: bills 9000 > transport 6000 > food 3000.
    expect(computeCategorySpending(data, { currency: 'XOF' })).toEqual([
      { categoryId: 'cat_bills', totalMinor: 9000 },
      { categoryId: 'cat_transport', totalMinor: 6000 },
      { categoryId: 'cat_food', totalMinor: 3000 },
    ]);
  });
});

describe('sortTransactions', () => {
  it('sorts newest date first, then newest creation, without changing the input', () => {
    const a = tx({ id: 'a', date: '2026-11-01' });
    const b = tx({ id: 'b', date: '2026-11-09', createdAt: '2026-11-09T09:00:00.000Z' });
    const c = tx({ id: 'c', date: '2026-11-09', createdAt: '2026-11-09T10:00:00.000Z' });
    const input = [a, b, c];
    expect(sortTransactions(input).map((t) => t.id)).toEqual(['c', 'b', 'a']);
    expect(input.map((t) => t.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('filterTransactions', () => {
  const data = [
    tx({ id: '1', title: 'Déjeuner', description: 'avec Awa', categoryId: 'cat_food' }),
    tx({ id: '2', title: 'Bus', categoryId: 'cat_transport', date: '2026-10-15' }),
    tx({ id: '3', title: 'Salary', type: 'income', categoryId: 'cat_salary', description: 'November' }),
  ];
  const ids = (filters: Partial<typeof DEFAULT_FILTERS>) =>
    filterTransactions(data, { ...DEFAULT_FILTERS, ...filters }).map((t) => t.id);

  it('returns everything with the default filters', () => {
    expect(ids({})).toEqual(['1', '2', '3']);
    expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(false);
  });

  it('searches title and description, ignoring case and accents', () => {
    expect(ids({ search: 'dejeuner' })).toEqual(['1']);
    expect(ids({ search: 'DÉJEUNER' })).toEqual(['1']);
    expect(ids({ search: 'awa' })).toEqual(['1']);
    expect(ids({ search: 'nov' })).toEqual(['3']);
    expect(ids({ search: '  bus ' })).toEqual(['2']);
    expect(ids({ search: 'zzz' })).toEqual([]);
  });

  it('filters by type, category and month, and combines them', () => {
    expect(ids({ type: 'income' })).toEqual(['3']);
    expect(ids({ type: 'expense' })).toEqual(['1', '2']);
    expect(ids({ categoryId: 'cat_transport' })).toEqual(['2']);
    expect(ids({ month: '2026-10' })).toEqual(['2']);
    expect(ids({ month: '2026-11', type: 'expense' })).toEqual(['1']);
    expect(ids({ month: '2026-11', categoryId: 'cat_transport' })).toEqual([]);
  });

  it('knows when a filter is active', () => {
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, search: ' ' })).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, search: 'a' })).toBe(true);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, month: '2026-11' })).toBe(true);
  });
});
