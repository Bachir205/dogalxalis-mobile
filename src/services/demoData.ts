import type { CurrencyCode } from '@/constants/currencies';
import { DataError } from '@/database/errors';
import { insertBudget } from '@/database/repositories/budgetRepository';
import { countDemo, softDeleteDemo, type DemoCounts } from '@/database/repositories/demoRepository';
import { insertTransaction } from '@/database/repositories/transactionRepository';
import type { Db } from '@/database/types';
import { translate, type Language, type TranslationKey } from '@/i18n';
import type { Budget, Transaction } from '@/types';
import { getToday, shiftMonth } from '@/utils/date';
import { parseAmountInput } from '@/utils/money';
import { generateId } from '@/utils/id';

type Amounts = Record<CurrencyCode, string>;

interface DemoTransaction {
  title: TranslationKey;
  type: 'income' | 'expense';
  categoryId: string;
  amounts: Amounts;
  /** 0 = this month, -1 = last month. */
  monthOffset: 0 | -1;
  /** Day of the month; never later than today. */
  day: number;
}

interface DemoBudget {
  categoryId: string;
  limits: Amounts;
}

/**
 * Sample data. Amounts are written per currency as text (parsed with the same function as the
 * forms, so no floating point). The budgets are chosen so that all four statuses are visible:
 * Food 88% (approaching), Transport 42% (normal), Bills 100% (reached), Entertainment 120% (exceeded).
 */
const TRANSACTIONS: readonly DemoTransaction[] = [
  { title: 'demo.salary', type: 'income', categoryId: 'cat_salary', monthOffset: 0, day: 1, amounts: { XOF: '250000', EUR: '380', USD: '415' } },
  { title: 'demo.freelance', type: 'income', categoryId: 'cat_freelance', monthOffset: 0, day: 8, amounts: { XOF: '60000', EUR: '90', USD: '100' } },
  { title: 'demo.groceries', type: 'expense', categoryId: 'cat_food', monthOffset: 0, day: 2, amounts: { XOF: '38000', EUR: '58', USD: '63' } },
  { title: 'demo.restaurant', type: 'expense', categoryId: 'cat_food', monthOffset: 0, day: 6, amounts: { XOF: '9000', EUR: '14', USD: '15' } },
  { title: 'demo.market', type: 'expense', categoryId: 'cat_food', monthOffset: 0, day: 14, amounts: { XOF: '6000', EUR: '9', USD: '10' } },
  { title: 'demo.taxi', type: 'expense', categoryId: 'cat_transport', monthOffset: 0, day: 3, amounts: { XOF: '12000', EUR: '18', USD: '20' } },
  { title: 'demo.fuel', type: 'expense', categoryId: 'cat_transport', monthOffset: 0, day: 12, amounts: { XOF: '5000', EUR: '8', USD: '8' } },
  { title: 'demo.electricity', type: 'expense', categoryId: 'cat_bills', monthOffset: 0, day: 7, amounts: { XOF: '20000', EUR: '31', USD: '33' } },
  { title: 'demo.internet', type: 'expense', categoryId: 'cat_bills', monthOffset: 0, day: 9, amounts: { XOF: '15000', EUR: '23', USD: '25' } },
  { title: 'demo.cinema', type: 'expense', categoryId: 'cat_entertainment', monthOffset: 0, day: 11, amounts: { XOF: '12000', EUR: '18', USD: '20' } },
  { title: 'demo.game', type: 'expense', categoryId: 'cat_entertainment', monthOffset: 0, day: 18, amounts: { XOF: '18000', EUR: '28', USD: '30' } },
  { title: 'demo.pharmacy', type: 'expense', categoryId: 'cat_health', monthOffset: 0, day: 15, amounts: { XOF: '8000', EUR: '12', USD: '13' } },
  { title: 'demo.salary', type: 'income', categoryId: 'cat_salary', monthOffset: -1, day: 1, amounts: { XOF: '250000', EUR: '380', USD: '415' } },
  { title: 'demo.groceries', type: 'expense', categoryId: 'cat_food', monthOffset: -1, day: 10, amounts: { XOF: '41000', EUR: '63', USD: '68' } },
  { title: 'demo.taxi', type: 'expense', categoryId: 'cat_transport', monthOffset: -1, day: 20, amounts: { XOF: '9000', EUR: '14', USD: '15' } },
];

const BUDGETS: readonly DemoBudget[] = [
  { categoryId: 'cat_food', limits: { XOF: '60000', EUR: '92', USD: '100' } },
  { categoryId: 'cat_transport', limits: { XOF: '40000', EUR: '61', USD: '66' } },
  { categoryId: 'cat_bills', limits: { XOF: '35000', EUR: '54', USD: '58' } },
  { categoryId: 'cat_entertainment', limits: { XOF: '25000', EUR: '38', USD: '42' } },
];

function minor(amounts: Amounts, currency: CurrencyCode): number {
  const result = parseAmountInput(amounts[currency], currency);
  if (!result.ok) throw new Error(`Invalid demo amount for ${currency}: ${amounts[currency]}`);
  return result.minor;
}

export interface DemoOptions {
  currency: CurrencyCode;
  language: Language;
  now?: Date;
}

/** Pure: builds the sample records for the given currency and language, relative to today. */
export function buildDemoData({ currency, language, now = new Date() }: DemoOptions): {
  transactions: Transaction[];
  budgets: Budget[];
} {
  const today = getToday(now);
  const thisMonth = today.slice(0, 7);
  const todayDay = Number(today.slice(8, 10));
  const stamp = now.toISOString();

  const transactions = TRANSACTIONS.map((item): Transaction => {
    const month = item.monthOffset === 0 ? thisMonth : shiftMonth(thisMonth, item.monthOffset);
    // This month never goes past today; last month uses the day as it is (days 1 to 28 exist in every month).
    const day = item.monthOffset === 0 ? Math.min(item.day, todayDay) : item.day;
    return {
      id: generateId(),
      title: translate(language, item.title),
      amountMinor: minor(item.amounts, currency),
      currency,
      type: item.type,
      categoryId: item.categoryId,
      description: null,
      date: `${month}-${String(day).padStart(2, '0')}`,
      createdAt: stamp,
      updatedAt: stamp,
      syncStatus: 'pending',
      isDemo: true,
    };
  });

  const budgets = BUDGETS.map(
    (item): Budget => ({
      id: generateId(),
      categoryId: item.categoryId,
      amountMinor: minor(item.limits, currency),
      currency,
      month: thisMonth,
      createdAt: stamp,
      updatedAt: stamp,
      syncStatus: 'pending',
      isDemo: true,
    }),
  );

  return { transactions, budgets };
}

export interface LoadDemoResult {
  /** True when sample data was already there: nothing was added. */
  alreadyLoaded: boolean;
  added: DemoCounts;
}

/**
 * Stores the sample data in SQLite through the normal repositories (so every rule applies).
 * Does nothing if sample data is already loaded. A budget that would duplicate one of the
 * user's own (same category, month and currency) is skipped.
 */
export async function loadDemoData(db: Db, options: DemoOptions): Promise<LoadDemoResult> {
  const existing = await countDemo(db);
  if (existing.transactions + existing.budgets > 0) {
    return { alreadyLoaded: true, added: { transactions: 0, budgets: 0 } };
  }
  const { transactions, budgets } = buildDemoData(options);
  const added: DemoCounts = { transactions: 0, budgets: 0 };
  await db.withTransactionAsync(async () => {
    for (const transaction of transactions) {
      await insertTransaction(db, transaction);
      added.transactions += 1;
    }
    for (const budget of budgets) {
      try {
        await insertBudget(db, budget);
        added.budgets += 1;
      } catch (error) {
        if (!(error instanceof DataError && error.code === 'DUPLICATE')) throw error;
      }
    }
  });
  return { alreadyLoaded: false, added };
}

export async function removeDemoData(db: Db, now: Date = new Date()): Promise<DemoCounts> {
  return softDeleteDemo(db, now.toISOString());
}

export { countDemo };
