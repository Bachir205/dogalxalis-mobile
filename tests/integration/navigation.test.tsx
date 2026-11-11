import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import { STORAGE_KEYS } from '@/constants/storageKeys';

import { flushPromises } from '../setup/helpers';

// The real drawer needs native animation: swap it for a plain stub (see the file header).
jest.mock('react-native-drawer-layout', () => require('../setup/drawerLayoutMock'));

const APP_DIR = 'src/app';

/** Renders the app and lets the saved theme/language load (the splash gate opens after that). */
async function startApp(initialUrl?: string) {
  await renderRouter(APP_DIR, initialUrl ? { initialUrl } : undefined);
  await flushPromises();
}

describe('navigation: tabs, drawer and stack', () => {
  it('opens on Home at "/"', async () => {
    await startApp();
    expect(screen).toHavePathname('/');
    expect(await screen.findByText(/Totals, recent transactions/)).toBeOnTheScreen();
  });

  it('switches between the four bottom tabs', async () => {
    await startApp();

    await fireEvent.press(screen.getByText('Transactions'));
    expect(screen).toHavePathname('/transactions');

    await fireEvent.press(screen.getByText('Budgets'));
    expect(screen).toHavePathname('/budgets');

    await fireEvent.press(screen.getByText('Settings'));
    expect(screen).toHavePathname('/settings');

    await fireEvent.press(screen.getByText('Home'));
    expect(screen).toHavePathname('/');
  });

  it('opens the drawer and reaches Categories, About and back to Dashboard', async () => {
    await startApp();

    await fireEvent.press(screen.getByLabelText('Open menu'));
    await fireEvent.press(screen.getByText('Categories'));
    expect(screen).toHavePathname('/categories');

    await fireEvent.press(screen.getByLabelText('Open menu'));
    await fireEvent.press(screen.getByText('About'));
    expect(screen).toHavePathname('/about');
    expect(await screen.findByText(/simple personal expense and budget manager/)).toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText('Open menu'));
    await fireEvent.press(screen.getByText('Dashboard', { exact: true }));
    expect(screen).toHavePathname('/');
  });

  it('opens the new-transaction modal from the Home floating button', async () => {
    await startApp();

    await fireEvent.press(screen.getByLabelText('Add transaction'));
    expect(screen).toHavePathname('/transactions/new');
    expect(await screen.findByText('The transaction form is built in Phase 4.')).toBeOnTheScreen();
  });

  it('goes from the Transactions tab to details and edit with a route parameter', async () => {
    await startApp('/transactions');

    await fireEvent.press(screen.getByText('Open a sample transaction (navigation test)'));
    expect(screen).toHavePathname('/transactions/sample');
    expect(await screen.findByText('Transaction id: sample')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Edit this transaction'));
    expect(screen).toHavePathname('/transactions/edit/sample');
  });

  it('opens the budget form from the Budgets tab', async () => {
    await startApp('/budgets');
    await fireEvent.press(screen.getByText('Add budget'));
    expect(screen).toHavePathname('/budgets/form');
  });

  it('opens the category form in edit mode when an id is given', async () => {
    await startApp('/categories/form?id=cat_food');
    expect(await screen.findByText('Editing category: cat_food')).toBeOnTheScreen();
  });

  it('switches the whole app to French from Settings and remembers it', async () => {
    await startApp('/settings');
    expect(screen.getByLabelText('Light')).toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText('Français'));
    // Tab label, section titles and options are now French, everywhere at once.
    expect(await screen.findByText('Thème')).toBeOnTheScreen();
    expect(screen.getAllByText('Paramètres').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('Clair')).toBeOnTheScreen();
    await flushPromises();
    expect(JSON.parse((await AsyncStorage.getItem(STORAGE_KEYS.preferences)) ?? '{}').language).toBe(
      'fr',
    );
  });

  it('changes and saves the theme mode from Settings', async () => {
    await startApp('/settings');
    expect(screen.getByLabelText('System')).toBeSelected();

    await fireEvent.press(screen.getByLabelText('Dark'));
    expect(screen.getByLabelText('Dark')).toBeSelected();
    await flushPromises();
    expect(await AsyncStorage.getItem(STORAGE_KEYS.themeMode)).toBe('"dark"');
  });
});
