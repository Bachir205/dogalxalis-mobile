import { CURRENCY_CODES } from '@/constants/currencies';
import { DEFAULT_CATEGORIES } from '@/constants/defaultCategories';
import { buildDemoData } from '@/services/demoData';
import { computeBudgetSummaries, computeBudgetTotals } from '@/utils/budgetCalculations';
import { computeTotals } from '@/utils/transactionCalculations';
import { isValidDate } from '@/utils/date';

const NOW = new Date(2026, 10, 20, 12, 0, 0); // 20 Nov 2026

describe('buildDemoData', () => {
  it.each(CURRENCY_CODES)('creates valid, marked sample records in %s', (currency) => {
    const { transactions, budgets } = buildDemoData({ currency, language: 'en', now: NOW });
    expect(transactions.length).toBeGreaterThan(10);
    expect(budgets).toHaveLength(4);

    for (const item of [...transactions, ...budgets]) {
      expect(item.isDemo).toBe(true);
      expect(item.currency).toBe(currency);
      expect(item.amountMinor).toBeGreaterThan(0);
      expect(Number.isInteger(item.amountMinor)).toBe(true);
      expect(item.syncStatus).toBe('pending');
    }
    const ids = [...transactions, ...budgets].map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const transaction of transactions) {
      const category = DEFAULT_CATEGORIES.find((c) => c.id === transaction.categoryId);
      expect(category?.type).toBe(transaction.type); // the category rule holds
      expect(isValidDate(transaction.date)).toBe(true);
      expect(transaction.title.length).toBeGreaterThan(0);
    }
    for (const budget of budgets) {
      expect(DEFAULT_CATEGORIES.find((c) => c.id === budget.categoryId)?.type).toBe('expense');
      expect(budget.month).toBe('2026-11');
    }
  });

  it.each(CURRENCY_CODES)('shows all four budget statuses in %s', (currency) => {
    const { transactions, budgets } = buildDemoData({ currency, language: 'en', now: NOW });
    const summaries = computeBudgetSummaries(budgets, transactions, { month: '2026-11', currency });
    const byCategory = Object.fromEntries(summaries.map((s) => [s.budget.categoryId, s]));
    expect(byCategory.cat_food.status).toBe('approaching');
    expect(byCategory.cat_transport.status).toBe('normal');
    expect(byCategory.cat_bills.status).toBe('reached');
    expect(byCategory.cat_entertainment.status).toBe('exceeded');
    expect(byCategory.cat_bills.progressPercent).toBe(100);
    expect(byCategory.cat_entertainment.progressPercent).toBeGreaterThan(100);
  });

  it('uses exact amounts (XOF)', () => {
    const { transactions, budgets } = buildDemoData({ currency: 'XOF', language: 'en', now: NOW });
    const summaries = computeBudgetSummaries(budgets, transactions, { month: '2026-11', currency: 'XOF' });
    const food = summaries.find((s) => s.budget.categoryId === 'cat_food');
    expect(food).toMatchObject({ spentMinor: 53000, progressPercent: 88 });
    expect(computeBudgetTotals(summaries)).toMatchObject({ allocatedMinor: 160000, spentMinor: 135000, count: 4 });
    expect(computeTotals(transactions, { currency: 'XOF', month: '2026-11' })).toMatchObject({ income: 310000 });
  });

  it('spreads the data over this month and last month, never in the future', () => {
    const { transactions } = buildDemoData({ currency: 'XOF', language: 'en', now: NOW });
    const months = new Set(transactions.map((t) => t.date.slice(0, 7)));
    expect(months).toEqual(new Set(['2026-11', '2026-10']));
    expect(transactions.every((t) => t.date <= '2026-11-20' || t.date.startsWith('2026-10'))).toBe(true);
  });

  it('never goes past today at the very start of a month', () => {
    const first = new Date(2026, 11, 1, 9, 0, 0); // 1 Dec 2026
    const { transactions } = buildDemoData({ currency: 'XOF', language: 'en', now: first });
    const thisMonth = transactions.filter((t) => t.date.startsWith('2026-12'));
    expect(thisMonth.length).toBeGreaterThan(0);
    expect(thisMonth.every((t) => t.date === '2026-12-01')).toBe(true);
    expect(transactions.some((t) => t.date.startsWith('2026-11'))).toBe(true); // last month still there
  });

  it('writes the titles in the chosen language', () => {
    const en = buildDemoData({ currency: 'XOF', language: 'en', now: NOW }).transactions.map((t) => t.title);
    const fr = buildDemoData({ currency: 'XOF', language: 'fr', now: NOW }).transactions.map((t) => t.title);
    expect(en).toContain('Groceries');
    expect(fr).toContain('Courses');
    expect(fr).toContain('Salaire du mois');
  });
});
