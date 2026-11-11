import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { AppProviders } from '@/contexts/AppProviders';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import { useBudgets } from '@/hooks/useBudgets';
import { usePreferences } from '@/hooks/usePreferences';
import { useTheme } from '@/hooks/useTheme';
import { useTransactions } from '@/hooks/useTransactions';
import type { NewBudgetInput, NewTransactionInput } from '@/types';

import { flushPromises } from '../setup/helpers';

const wrapper = ({ children }: { children: ReactNode }) => <AppProviders>{children}</AppProviders>;

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

/**
 * Pretends the phone is in light or dark mode. useColorScheme is a getter on the real
 * react-native module, so we spy on that module (an `import *` copy would not work).
 */
function mockSystemScheme(scheme: 'light' | 'dark') {
  const reactNative = jest.requireActual('react-native');
  jest.spyOn(reactNative, 'useColorScheme', 'get').mockReturnValue(() => scheme);
}

afterEach(() => jest.restoreAllMocks());

describe('ThemeContext', () => {
  it('follows the system scheme in System mode', async () => {
    mockSystemScheme('dark');
    const { result } = await renderHook(() => useTheme(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.mode).toBe('system');
    expect(result.current.scheme).toBe('dark');
  });

  it('lets a manual choice override the system, and saves it', async () => {
    mockSystemScheme('dark');
    const { result } = await renderHook(() => useTheme(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    await act(async () => result.current.setMode('light'));
    expect(result.current.scheme).toBe('light');
    expect(result.current.colors.background).not.toBe('#0E1512');
    await flushPromises();
    expect(await AsyncStorage.getItem(STORAGE_KEYS.themeMode)).toBe('"light"');
  });

  it('restores the saved mode at startup', async () => {
    mockSystemScheme('light');
    await AsyncStorage.setItem(STORAGE_KEYS.themeMode, '"dark"');
    const { result } = await renderHook(() => useTheme(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.mode).toBe('dark');
    expect(result.current.scheme).toBe('dark');
  });

  it('ignores a corrupted saved value', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.themeMode, '"purple"');
    const { result } = await renderHook(() => useTheme(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.mode).toBe('system');
  });
});

describe('PreferencesContext', () => {
  it('starts with the device language and XOF', async () => {
    const { result } = await renderHook(() => usePreferences(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.language).toBe('en');
    expect(result.current.currency).toBe('XOF');
  });

  it('saves changes and restores them on the next start', async () => {
    const first = await renderHook(() => usePreferences(), { wrapper });
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

    const second = await renderHook(() => usePreferences(), { wrapper });
    await waitFor(() => expect(second.result.current.isReady).toBe(true));
    expect(second.result.current.language).toBe('fr');
    expect(second.result.current.currency).toBe('EUR');
  });

  it('keeps the valid fields and drops the invalid ones', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.preferences,
      JSON.stringify({ language: 'fr', currency: 'ABC' }),
    );
    const { result } = await renderHook(() => usePreferences(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.language).toBe('fr');
    expect(result.current.currency).toBe('XOF');
  });
});

describe('TransactionsContext', () => {
  it('adds, updates and removes transactions', async () => {
    const { result } = await renderHook(() => useTransactions(), { wrapper });
    expect(result.current.transactions).toEqual([]);

    await act(async () => {
      await result.current.addTransaction(expense);
    });
    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.transactions[0]).toMatchObject({
      ...expense,
      syncStatus: 'pending',
    });
    const id = result.current.transactions[0].id;

    await act(async () => result.current.updateTransaction(id, { amountMinor: 4000 }));
    expect(result.current.transactions[0].amountMinor).toBe(4000);

    await act(async () => result.current.removeTransaction(id));
    expect(result.current.transactions).toEqual([]);
  });

  it('keeps the same action functions between renders (useCallback)', async () => {
    const { result } = await renderHook(() => useTransactions(), { wrapper });
    const before = result.current.addTransaction;
    await act(async () => {
      await result.current.addTransaction(expense);
    });
    expect(result.current.addTransaction).toBe(before);
  });
});

describe('BudgetsContext', () => {
  it('starts on the current month and navigates across a year boundary', async () => {
    const { result } = await renderHook(() => useBudgets(), { wrapper });
    expect(result.current.selectedMonth).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);

    await act(async () => result.current.setSelectedMonth('2026-01'));
    await act(async () => result.current.goToPreviousMonth());
    expect(result.current.selectedMonth).toBe('2025-12');
    await act(async () => result.current.goToNextMonth());
    expect(result.current.selectedMonth).toBe('2026-01');
  });

  it('creates, updates and removes budgets', async () => {
    const { result } = await renderHook(() => useBudgets(), { wrapper });
    await act(async () => {
      await result.current.createBudget(budget);
    });
    expect(result.current.budgets).toHaveLength(1);
    const id = result.current.budgets[0].id;

    await act(async () => result.current.updateBudget(id, { amountMinor: 90000 }));
    expect(result.current.budgets[0].amountMinor).toBe(90000);

    await act(async () => result.current.removeBudget(id));
    expect(result.current.budgets).toEqual([]);
  });
});
