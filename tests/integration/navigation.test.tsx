import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, screen } from 'expo-router/testing-library';

import { STORAGE_KEYS } from '@/constants/storageKeys';

import { startApp } from '../setup/app';
import { flushPromises } from '../setup/helpers';

describe('navigation: tabs, drawer and stack', () => {
  it('opens on Home (the dashboard) at "/"', async () => {
    await startApp();
    expect(screen).toHavePathname('/');
    expect(await screen.findByText('Spending by category')).toBeOnTheScreen();
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
    expect(await screen.findByText('Expense categories')).toBeOnTheScreen();

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
    expect(await screen.findByLabelText('Title')).toBeOnTheScreen();
  });

  it('opens the budget form from the Budgets tab', async () => {
    await startApp('/budgets');
    await fireEvent.press(screen.getByText('Add budget'));
    expect(screen).toHavePathname('/budgets/form');
  });

  it('opens the category form in edit mode when an id is given', async () => {
    await startApp('/categories/form?id=cat_food');
    expect(await screen.findByDisplayValue('Food')).toBeOnTheScreen();
  });

  it('switches the whole app to French from Settings and remembers it', async () => {
    await startApp('/settings');
    expect(screen.getByLabelText('Light')).toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText('Français'));
    expect(await screen.findByText('Thème')).toBeOnTheScreen();
    expect(screen.getAllByText('Paramètres').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('Clair')).toBeOnTheScreen();
    await flushPromises();
    expect(JSON.parse((await AsyncStorage.getItem(STORAGE_KEYS.preferences)) ?? '{}').language).toBe('fr');
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
