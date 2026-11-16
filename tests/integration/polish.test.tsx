import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, within } from '@testing-library/react-native';
import { router } from 'expo-router';
import { act, fireEvent, screen, waitFor } from 'expo-router/testing-library';
import { Alert, StyleSheet } from 'react-native';

import { STORAGE_KEYS } from '@/constants/storageKeys';
import { getAllBudgets } from '@/database/repositories/budgetRepository';
import { getAllTransactions } from '@/database/repositories/transactionRepository';
import { ErrorBoundary } from '@/app/_layout';
import { loadDemoData } from '@/services/demoData';

import { press, startApp, typeInto } from '../setup/app';
import { FakeApi } from '../setup/fakeApi';
import { flushPromises } from '../setup/helpers';
import { seedBudget, seedTransaction } from '../setup/seed';
import { openDatabaseAsync } from '../setup/sqliteMock';

let mockApi: FakeApi | null = null;
jest.mock('@/services/api', () => ({
  ...jest.requireActual('@/services/api'),
  getApiClient: () => mockApi,
}));
beforeEach(() => {
  mockApi = null;
});
afterEach(() => jest.restoreAllMocks());

async function goTo(url: string) {
  await act(async () => {
    router.navigate(url as never);
  });
}

/** Every piece of text currently drawn on the screen. */
function visibleTexts(): string[] {
  const out: string[] = [];
  const walk = (node: unknown) => {
    if (node === null || node === undefined) return;
    if (typeof node === 'string') {
      out.push(node);
      return;
    }
    if (Array.isArray(node)) return node.forEach(walk);
    const { children } = node as { children?: unknown };
    walk(children);
  };
  walk(screen.toJSON());
  return out;
}

describe('demo data', () => {
  it('loads marked sample data from Settings, shows all four budget statuses, and removes it again', async () => {
    await seedTransaction({ title: 'My own lunch', amountMinor: 1000 });
    await startApp('/settings');

    await press('Load demo data');
    expect(await screen.findByText(/Added 15 transactions and 4 budgets/)).toBeOnTheScreen();
    expect(screen.getByText(/Demo data is loaded: 15 transactions and 4 budgets/)).toBeOnTheScreen();
    expect(screen.queryByLabelText('Load demo data')).toBeNull();

    await fireEvent.press(screen.getByText('Budgets'));
    expect(await screen.findByText('Approaching limit')).toBeOnTheScreen();
    expect(screen.getByText('Normal')).toBeOnTheScreen();
    expect(screen.getByText('Budget reached')).toBeOnTheScreen();
    expect(screen.getByText('Budget exceeded')).toBeOnTheScreen();
    expect(screen.getAllByText('Demo')).toHaveLength(4);

    await fireEvent.press(screen.getByText('Home'));
    expect(screen.getAllByText('Demo').length).toBeGreaterThan(0);

    const db = await openDatabaseAsync();
    expect((await getAllBudgets(db)).every((b) => b.isDemo)).toBe(true);

    // Remove: asks first, keeps the user's own data.
    await fireEvent.press(screen.getByText('Settings'));
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await press('Remove demo data');
    expect(alert).toHaveBeenCalledWith('Remove demo data?', expect.stringContaining('Your own data is kept'), expect.any(Array));
    const buttons = alert.mock.calls[0][2] ?? [];
    await act(async () => {
      await buttons[1].onPress?.();
    });
    expect(await screen.findByText(/Removed 15 transactions and 4 budgets/)).toBeOnTheScreen();
    expect(screen.getByLabelText('Load demo data')).toBeOnTheScreen();

    expect((await getAllTransactions(db)).map((t) => t.title)).toEqual(['My own lunch']);
    await fireEvent.press(screen.getByText('Budgets'));
    expect(await screen.findByText('No budgets this month')).toBeOnTheScreen();
  });

  it('loads the sample data in the active currency and language', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.preferences, JSON.stringify({ language: 'fr', currency: 'EUR' }));
    await startApp('/settings');
    await press('Charger les données de démo');
    expect(await screen.findByText(/15 transactions et 4 budgets ajoutés/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Accueil'));
    expect((await screen.findAllByText('Démo')).length).toBeGreaterThan(0);
    expect((await getAllTransactions(await openDatabaseAsync())).every((t) => t.currency === 'EUR')).toBe(true);
  });
});

describe('sync banner', () => {
  it('tells the user when changes are waiting, and goes away once they are sent', async () => {
    mockApi = new FakeApi();
    mockApi.offline = true;
    await startApp();
    await press('Add transaction');
    await screen.findByLabelText('Title');
    await typeInto('Title', 'Lunch');
    await typeInto('Amount (FCFA)', '2500');
    await press('Food');
    await press('Save');
    expect(await screen.findByLabelText('Offline. Changes waiting to be sent: 1')).toBeOnTheScreen();

    mockApi.offline = false;
    await press('Offline. Changes waiting to be sent: 1'); // tapping the banner synchronizes
    await waitFor(() => expect(mockApi?.transactions.size).toBe(1));
    await waitFor(() => expect(screen.queryByLabelText(/Changes waiting to be sent/)).toBeNull());
  });

  it('shows nothing without a server, and nothing when everything is in sync', async () => {
    await seedTransaction({});
    await startApp();
    expect(screen.queryByLabelText(/waiting/i)).toBeNull();

    mockApi = new FakeApi();
    await screen.unmount();
    await startApp();
    await waitFor(() => expect(mockApi?.transactions.size).toBe(1));
    await waitFor(() => expect(screen.queryByLabelText(/waiting to be sent/i)).toBeNull());
  });
});

describe('pull to refresh', () => {
  it('synchronizes when a server is configured (transactions list)', async () => {
    mockApi = new FakeApi();
    await startApp('/transactions');
    await waitFor(() => expect(mockApi?.calls).toContain('GET transactions'));
    const before = mockApi.calls.filter((c) => c === 'GET transactions').length;

    const list = screen.getByTestId('transactions-list');
    await act(async () => {
      await list.props.onRefresh();
    });
    expect(mockApi.calls.filter((c) => c === 'GET transactions').length).toBeGreaterThan(before);
  });

  it('re-reads the phone data when there is no server (dashboard)', async () => {
    await startApp();
    expect(screen.queryByText('Late arrival')).toBeNull();
    await seedTransaction({ title: 'Late arrival' }); // written behind the app's back
    const scroll = screen.getByTestId('screen-scroll');
    await act(async () => {
      await scroll.props.refreshControl.props.onRefresh();
    });
    expect(await screen.findByText('Late arrival')).toBeOnTheScreen();
  });
});

describe('error and loading states', () => {
  it('shows an error with "Try again" when the data cannot be read, and recovers', async () => {
    await seedTransaction({ title: 'Saved lunch' });
    const repository = require('@/database/repositories/transactionRepository');
    jest.spyOn(repository, 'getAllTransactions').mockRejectedValueOnce(new Error('disk error'));
    await startApp();

    expect(await screen.findByText('The data could not be loaded.')).toBeOnTheScreen();
    await press('Try again');
    expect(await screen.findByText('Saved lunch')).toBeOnTheScreen();
    expect(screen.queryByText('The data could not be loaded.')).toBeNull();
  });

  it('shows the crash screen on its own, in the device language, with a working retry', async () => {
    const retry = jest.fn();
    const first = await render(<ErrorBoundary error={new Error('boom')} retry={retry} />);
    expect(screen.getByText('Something went wrong.')).toBeOnTheScreen();
    expect(screen.getByText('boom')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Try again'));
    expect(retry).toHaveBeenCalledTimes(1);
    await first.unmount();

    jest.spyOn(require('@/i18n/device'), 'detectDeviceLanguage').mockReturnValue('fr');
    await render(<ErrorBoundary error={new Error('boom')} retry={retry} />);
    expect(screen.getByText('Un problème est survenu.')).toBeOnTheScreen();
    expect(screen.getByLabelText('Réessayer')).toBeOnTheScreen();
  });
});

describe('accessibility and consistency', () => {
  it('uses touch targets of at least 48 dp for chips, options and color swatches', async () => {
    await startApp('/transactions/new');
    const minHeight = (label: string) => StyleSheet.flatten(screen.getByLabelText(label).props.style).minHeight;
    expect(minHeight('Food')).toBeGreaterThanOrEqual(48);
    expect(minHeight('Income')).toBeGreaterThanOrEqual(48);
    expect(minHeight('Save')).toBeGreaterThanOrEqual(48);

    await goTo('/categories/form');
    const swatch = StyleSheet.flatten((await screen.findByLabelText('#E67E22')).props.style);
    expect(swatch.width).toBeGreaterThanOrEqual(48);
    expect(swatch.height).toBeGreaterThanOrEqual(48);
    const icon = StyleSheet.flatten(screen.getByLabelText('gift').props.style);
    expect(icon.width).toBeGreaterThanOrEqual(48);
  });

  it.each([
    ['English', undefined],
    ['French', { language: 'fr', currency: 'XOF' }],
  ])('never shows a raw translation key or an unfilled placeholder (%s)', async (_name, preferences) => {
    if (preferences) await AsyncStorage.setItem(STORAGE_KEYS.preferences, JSON.stringify(preferences));
    const db = await openDatabaseAsync();
    await seedTransaction({});
    await loadDemoData(db, { currency: 'XOF', language: preferences ? 'fr' : 'en' });
    await seedBudget({ categoryId: 'cat_health', amountMinor: 5000 });

    await startApp();
    for (const url of ['/', '/transactions', '/budgets', '/settings', '/categories', '/about', '/transactions/new', '/budgets/form', '/categories/form']) {
      await goTo(url);
      await flushPromises();
      const texts = visibleTexts().filter((text) => text.trim() !== '');
      expect(texts.length).toBeGreaterThan(0);
      for (const text of texts) {
        expect(text).not.toMatch(/[{}]/); // "{count}" left in a message
        expect(text).not.toMatch(/^[a-z][A-Za-z]+(\.[A-Za-z_]+)+$/); // "home.title" shown as text
      }
    }
  });

  it('every button on the main screens has an accessible name (a label, or visible text inside it)', async () => {
    await seedTransaction({});
    await seedBudget({});
    await startApp();
    for (const url of ['/', '/transactions', '/budgets', '/settings', '/categories', '/about']) {
      await goTo(url);
      await flushPromises();
      for (const button of screen.queryAllByRole('button')) {
        const label = (button.props.accessibilityLabel ?? button.props['aria-label']) as string | undefined;
        const hasLabel = typeof label === 'string' && label.trim().length > 0;
        // The bottom-tab buttons come from React Navigation: they are named by the text they contain.
        const hasText = within(button).queryAllByText(/\S/).length > 0;
        expect(hasLabel || hasText).toBe(true);
      }
    }
  });
});
