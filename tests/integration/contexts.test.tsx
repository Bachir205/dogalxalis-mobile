import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { STORAGE_KEYS } from '@/constants/storageKeys';
import { AppProviders } from '@/contexts/AppProviders';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { DataError } from '@/database/errors';
import { getAllTransactions } from '@/database/repositories/transactionRepository';
import { useBudgets } from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useCategories';
import { useDatabase } from '@/hooks/useDatabase';
import { usePreferences } from '@/hooks/usePreferences';
import { useTheme } from '@/hooks/useTheme';
import { useTransactions } from '@/hooks/useTransactions';
import type { NewBudgetInput, NewTransactionInput } from '@/types';

import { flushPromises } from '../setup/helpers';

// Theme and preferences need no database; the data contexts get every provider.
const lightWrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>
    <PreferencesProvider>{children}</PreferencesProvider>
  </ThemeProvider>
);
const appWrapper = ({ children }: { children: ReactNode }) => <AppProviders>{children}</AppProviders>;

const expense: NewTransactionInput = {
  title: 'Lunch',
  amountMinor: 2500,
  currency: 'XOF',
  type: 'expense',
  categoryId: 'cat_food',
  description: null,
  date: '2026-11-10',
};

const budget: NewBudgetInput = {
  categoryId: 'cat_food',
  amountMinor: 100000,
  currency: 'XOF',
  month: '2026-11',
};

/** One hook that exposes everything the data tests need. */
const useData = () => ({
  db: useDatabase(),
  tx: useTransactions(),
  categories: useCategories(),
  budgets: useBudgets(),
});

async function renderData() {
  const hook = await renderHook(useData, { wrapper: appWrapper });
  await waitFor(() => {
    expect(hook.result.current?.tx.status).toBe('ready');
    expect(hook.result.current?.categories.status).toBe('ready');
  });
  return hook;
}

/** pretends the phone is in light or dark mode (useColorScheme is a getter on react-native). */
function mockSystemScheme(scheme: 'light' | 'dark') {
  const reactNative = jest.requireActual('react-native');
  jest.spyOn(reactNative, 'useColorScheme', 'get').mockReturnValue(() => scheme);
}

afterEach(() => jest.restoreAllMocks());

describe('ThemeContext', () => {
  it('follows the system scheme in System mode', async () => {
    mockSystemScheme('dark');
    const { result } = await renderHook(() => useTheme(), { wrapper: lightWrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.mode).toBe('system');
    expect(result.current.scheme).toBe('dark');
  });

  it('lets a manual choice override the system, and saves it', async () => {
    mockSystemScheme('dark');
    const { result } = await renderHook(() => useTheme(), { wrapper: lightWrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    await act(async () => result.current.setMode('light'));
    expect(result.current.scheme).toBe('light');
    await flushPromises();
    expect(await AsyncStorage.getItem(STORAGE_KEYS.themeMode)).toBe('"light"');
  });

  it('restores the saved mode at startup, and ignores a corrupted one', async () => {
    mockSystemScheme('light');
    await AsyncStorage.setItem(STORAGE_KEYS.themeMode, '"dark"');
    const saved = await renderHook(() => useTheme(), { wrapper: lightWrapper });
    await waitFor(() => expect(saved.result.current.isReady).toBe(true));
    expect(saved.result.current.scheme).toBe('dark');
    await saved.unmount();

    await AsyncStorage.setItem(STORAGE_KEYS.themeMode, '"purple"');
    const corrupted = await renderHook(() => useTheme(), { wrapper: lightWrapper });
    await waitFor(() => expect(corrupted.result.current.isReady).toBe(true));
    expect(corrupted.result.current.mode).toBe('system');
  });
});

describe('PreferencesContext', () => {
  it('starts with the device language and XOF', async () => {
    const { result } = await renderHook(() => usePreferences(), { wrapper: lightWrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.language).toBe('en');
    expect(result.current.currency).toBe('XOF');
  });

  it('saves changes and restores them on the next start', async () => {
    const first = await renderHook(() => usePreferences(), { wrapper: lightWrapper });
    await waitFor(() => expect(first.result.current.isReady).toBe(true));
    await act(async () => {
      first.result.current.setLanguage('fr');
      first.result.current.setCurrency('EUR');
    });
    await flushPromises();
    expect(JSON.parse((await AsyncStorage.getItem(STORAGE_KEYS.preferences)) ?? '{}')).toEqual({
      language: 'fr',
      currency: 'EUR',
    });
    await first.unmount();

    const second = await renderHook(() => usePreferences(), { wrapper: lightWrapper });
    await waitFor(() => expect(second.result.current.isReady).toBe(true));
    expect(second.result.current.language).toBe('fr');
    expect(second.result.current.currency).toBe('EUR');
  });

  it('keeps the valid fields and drops the invalid ones', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.preferences, JSON.stringify({ language: 'fr', currency: 'ABC' }));
    const { result } = await renderHook(() => usePreferences(), { wrapper: lightWrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.language).toBe('fr');
    expect(result.current.currency).toBe('XOF');
  });
});

describe('CategoriesContext', () => {
  it('loads the 13 seeded categories from SQLite', async () => {
    const { result } = await renderData();
    expect(result.current.categories.categories).toHaveLength(13);
    expect(result.current.categories.categoriesById.cat_food).toMatchObject({ name: 'Food', type: 'expense' });
  });

  it('adds and edits a category, refuses a duplicate, and keeps the data after a restart', async () => {
    const first = await renderData();
    await act(async () => {
      await first.result.current.categories.addCategory({ name: 'Gifts', type: 'expense', icon: 'gift', color: '#E67E22' });
    });
    expect(first.result.current.categories.categories).toHaveLength(14);

    await act(async () => {
      await first.result.current.categories.updateCategory('cat_food', { name: 'Groceries' });
    });
    expect(first.result.current.categories.categoriesById.cat_food.name).toBe('Groceries');

    let error: unknown;
    await act(async () => {
      await first.result.current.categories
        .addCategory({ name: 'gifts', type: 'expense', icon: 'tag', color: '#E67E22' })
        .catch((e) => (error = e));
    });
    expect(error).toBeInstanceOf(DataError);
    expect(first.result.current.categories.categories).toHaveLength(14);
    await first.unmount();

    const second = await renderData();
    expect(second.result.current.categories.categories).toHaveLength(14);
    expect(second.result.current.categories.categoriesById.cat_food.name).toBe('Groceries');
  });
});

describe('TransactionsContext', () => {
  it('starts empty, then adds, updates and removes transactions in SQLite and in state', async () => {
    const { result } = await renderData();
    expect(result.current.tx.transactions).toEqual([]);

    await act(async () => {
      await result.current.tx.addTransaction(expense);
    });
    expect(result.current.tx.transactions).toHaveLength(1);
    const id = result.current.tx.transactions[0].id;
    expect(await getAllTransactions(result.current.db)).toHaveLength(1);

    await act(async () => result.current.tx.updateTransaction(id, { amountMinor: 4000 }));
    expect(result.current.tx.transactions[0].amountMinor).toBe(4000);
    expect((await getAllTransactions(result.current.db))[0].amountMinor).toBe(4000);

    await act(async () => result.current.tx.removeTransaction(id));
    expect(result.current.tx.transactions).toEqual([]);
    expect(await getAllTransactions(result.current.db)).toEqual([]);
  });

  it('keeps the data after the app is closed and reopened', async () => {
    const first = await renderData();
    await act(async () => {
      await first.result.current.tx.addTransaction(expense);
    });
    await first.unmount();

    const second = await renderData();
    expect(second.result.current.tx.transactions).toHaveLength(1);
    expect(second.result.current.tx.transactions[0]).toMatchObject({ title: 'Lunch', amountMinor: 2500 });
  });

  it('refuses a category of the wrong type and leaves the state untouched', async () => {
    const { result } = await renderData();
    let error: unknown;
    await act(async () => {
      await result.current.tx
        .addTransaction({ ...expense, categoryId: 'cat_salary' })
        .catch((e) => (error = e));
    });
    expect(error).toMatchObject({ code: 'CATEGORY_TYPE_MISMATCH' });
    expect(result.current.tx.transactions).toEqual([]);
    expect(await getAllTransactions(result.current.db)).toEqual([]);
  });

  it('keeps the same action functions between renders (useCallback)', async () => {
    const { result } = await renderData();
    const before = result.current.tx.addTransaction;
    await act(async () => {
      await result.current.tx.addTransaction(expense);
    });
    expect(result.current.tx.addTransaction).toBe(before);
  });
});

describe('BudgetsContext (in memory until Phase 5)', () => {
  it('starts on the current month and navigates across a year boundary', async () => {
    const { result } = await renderData();
    expect(result.current.budgets.selectedMonth).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);

    await act(async () => result.current.budgets.setSelectedMonth('2026-01'));
    await act(async () => result.current.budgets.goToPreviousMonth());
    expect(result.current.budgets.selectedMonth).toBe('2025-12');
    await act(async () => result.current.budgets.goToNextMonth());
    expect(result.current.budgets.selectedMonth).toBe('2026-01');
  });

  it('creates, updates and removes budgets', async () => {
    const { result } = await renderData();
    await act(async () => {
      await result.current.budgets.createBudget(budget);
    });
    expect(result.current.budgets.budgets).toHaveLength(1);
    const id = result.current.budgets.budgets[0].id;

    await act(async () => result.current.budgets.updateBudget(id, { amountMinor: 90000 }));
    expect(result.current.budgets.budgets[0].amountMinor).toBe(90000);

    await act(async () => result.current.budgets.removeBudget(id));
    expect(result.current.budgets.budgets).toEqual([]);
  });
});
