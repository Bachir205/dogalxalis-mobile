import { router } from 'expo-router';
import { act, fireEvent, screen } from 'expo-router/testing-library';
import { Alert } from 'react-native';

import { runMigrations } from '@/database/migrations';
import { getAllTransactions, insertTransaction } from '@/database/repositories/transactionRepository';
import type { Transaction } from '@/types';
import { getCurrentMonth, getToday, shiftMonth } from '@/utils/date';

import { press, startApp, typeInto } from '../setup/app';
import { openDatabaseAsync } from '../setup/sqliteMock';

let seq = 0;
/** Puts a transaction straight into the database, as if it had been saved in an earlier session. */
async function seed(overrides: Partial<Transaction>) {
  const db = await openDatabaseAsync();
  await runMigrations(db);
  seq += 1;
  await insertTransaction(db, {
    id: `seed-${seq}`,
    title: 'Lunch',
    amountMinor: 2500,
    currency: 'XOF',
    type: 'expense',
    categoryId: 'cat_food',
    description: null,
    date: getToday(),
    createdAt: `2026-11-10T08:00:${String(seq).padStart(2, '0')}.000Z`,
    updatedAt: '2026-11-10T08:00:00.000Z',
    syncStatus: 'pending',
    ...overrides,
  });
}

async function addLunchThroughTheForm() {
  await press('Add transaction');
  await screen.findByLabelText('Title');
  await typeInto('Title', 'Lunch');
  await typeInto('Amount (FCFA)', '2500');
  await press('Food');
  await press('Save');
}

async function goTo(url: string) {
  await act(async () => {
    router.navigate(url as never);
  });
}

describe('adding a transaction', () => {
  it('saves it to SQLite, shows it on Home and updates the dashboard', async () => {
    await startApp();
    expect(screen.getByLabelText('Expenses: 0 FCFA')).toBeOnTheScreen();

    await addLunchThroughTheForm();

    expect(await screen.findByText('Lunch')).toBeOnTheScreen();
    expect(screen).toHavePathname('/');
    expect(screen.getByLabelText('Expenses: 2,500 FCFA')).toBeOnTheScreen();
    expect(screen.getByLabelText('Income: 0 FCFA')).toBeOnTheScreen();
    expect(screen.getByLabelText('Net: -2,500 FCFA')).toBeOnTheScreen();
    expect(screen.getByText('Transactions: 1')).toBeOnTheScreen();

    const saved = await getAllTransactions(await openDatabaseAsync());
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      title: 'Lunch',
      amountMinor: 2500,
      currency: 'XOF',
      type: 'expense',
      categoryId: 'cat_food',
      date: getToday(),
    });
  });

  it('shows validation errors and saves nothing when the form is incomplete', async () => {
    await startApp('/transactions/new');
    await press('Save');

    expect(await screen.findByText('Enter a title.')).toBeOnTheScreen();
    expect(screen.getByText('Enter an amount.')).toBeOnTheScreen();
    expect(screen.getByText('Choose a category.')).toBeOnTheScreen();
    expect(await getAllTransactions(await openDatabaseAsync())).toEqual([]);

    await typeInto('Amount (FCFA)', '10.5');
    await press('Save');
    expect(await screen.findByText('Too many decimals for this currency.')).toBeOnTheScreen();
  });

  it('only offers categories of the chosen type and clears an invalid choice', async () => {
    await startApp('/transactions/new');
    await press('Food');
    expect(screen.queryByLabelText('Salary')).toBeNull();

    await press('Income');
    expect(screen.queryByLabelText('Food')).toBeNull();
    expect(screen.getByLabelText('Salary')).toBeOnTheScreen();

    await press('Save');
    expect(await screen.findByText('Choose a category.')).toBeOnTheScreen();
  });

  it('keeps the transaction after the app is closed and reopened', async () => {
    await startApp();
    await addLunchThroughTheForm();
    expect(await screen.findByText('Lunch')).toBeOnTheScreen();

    await screen.unmount();
    await startApp();
    expect(await screen.findByText('Lunch')).toBeOnTheScreen();
    expect(screen.getByLabelText('Expenses: 2,500 FCFA')).toBeOnTheScreen();
  });
});

describe('editing and deleting', () => {
  it('edits a transaction and recalculates the dashboard', async () => {
    await seed({});
    await startApp();
    expect(screen.getByLabelText('Expenses: 2,500 FCFA')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Lunch'));
    await press('Edit');
    expect(await screen.findByDisplayValue('Lunch')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('2500')).toBeOnTheScreen();

    await typeInto('Title', 'Dinner');
    await typeInto('Amount (FCFA)', '4000');
    await press('Save');
    expect(await screen.findByText('Dinner')).toBeOnTheScreen();

    await goTo('/');
    expect(await screen.findByLabelText('Expenses: 4,000 FCFA')).toBeOnTheScreen();
    const [saved] = await getAllTransactions(await openDatabaseAsync());
    expect(saved).toMatchObject({ title: 'Dinner', amountMinor: 4000 });
  });

  it('asks for confirmation, then deletes: hidden everywhere, soft-deleted in SQLite', async () => {
    await seed({});
    await startApp('/transactions');
    await fireEvent.press(screen.getByText('Lunch'));

    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await press('Delete');
    expect(alert).toHaveBeenCalledWith('Delete transaction?', 'Delete "Lunch"? This cannot be undone.', expect.any(Array));
    // Cancelling does nothing.
    expect(await getAllTransactions(await openDatabaseAsync())).toHaveLength(1);

    const buttons = alert.mock.calls[0][2] ?? [];
    await act(async () => {
      await buttons[1].onPress?.();
    });

    expect(await screen.findByText('No transactions yet')).toBeOnTheScreen();
    const db = await openDatabaseAsync();
    expect(await getAllTransactions(db)).toEqual([]);
    const row = await db.getFirstAsync<{ deleted_at: string | null }>('SELECT deleted_at FROM transactions', []);
    expect(row?.deleted_at).not.toBeNull();
    alert.mockRestore();
  });
});

describe('transactions list: search and filters', () => {
  const lastMonth = shiftMonth(getCurrentMonth(), -1);

  beforeEach(async () => {
    await seed({ title: 'Lunch', categoryId: 'cat_food' });
    await seed({ title: 'Bus', categoryId: 'cat_transport', date: `${lastMonth}-15` });
    await seed({ title: 'Paycheck', type: 'income', categoryId: 'cat_salary', amountMinor: 100000 });
  });

  const visible = () => ['Lunch', 'Bus', 'Paycheck'].filter((title) => screen.queryByText(title) !== null);

  it('searches, filters by type, category and month, and clears the filters', async () => {
    await startApp('/transactions');
    expect(visible()).toEqual(['Lunch', 'Bus', 'Paycheck']);

    await typeInto('Search transactions', 'bus');
    expect(visible()).toEqual(['Bus']);
    await typeInto('Search transactions', '');

    await press('Income');
    expect(visible()).toEqual(['Paycheck']);
    await press('All');
    expect(visible()).toEqual(['Lunch', 'Bus', 'Paycheck']);

    await press('Transport');
    expect(visible()).toEqual(['Bus']);
    await press('All categories');

    await press('By month');
    expect(visible()).toEqual(['Lunch', 'Paycheck']);
    await press('Previous month');
    expect(visible()).toEqual(['Bus']);

    await typeInto('Search transactions', 'zzz');
    expect(await screen.findByText('No matching transactions')).toBeOnTheScreen();
    await press('Clear filters');
    expect(visible()).toEqual(['Lunch', 'Bus', 'Paycheck']);
  });
});

describe('dashboard scope', () => {
  it('counts only the current month and the active currency, and follows the period and currency choice', async () => {
    const lastMonth = shiftMonth(getCurrentMonth(), -1);
    await seed({ type: 'income', categoryId: 'cat_salary', amountMinor: 100000, title: 'Pay' });
    await seed({ amountMinor: 30000, title: 'Rent' });
    await seed({ amountMinor: 5000, title: 'Old', date: `${lastMonth}-10` });
    await seed({ amountMinor: 7777, title: 'Euro', currency: 'EUR' });

    await startApp();
    expect(screen.getByLabelText('Income: 100,000 FCFA')).toBeOnTheScreen();
    expect(screen.getByLabelText('Expenses: 30,000 FCFA')).toBeOnTheScreen();
    expect(screen.getByLabelText('Net: +70,000 FCFA')).toBeOnTheScreen();
    expect(screen.getByText('Transactions: 2')).toBeOnTheScreen();

    await press('All time');
    expect(screen.getByLabelText('Expenses: 35,000 FCFA')).toBeOnTheScreen();
    expect(screen.getByText('Transactions: 3')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Settings'));
    await press('EUR (€)');
    await fireEvent.press(screen.getByText('Home'));
    expect(screen.getByLabelText('Expenses: 77.77 €')).toBeOnTheScreen();
    expect(screen.getByText('Transactions: 1')).toBeOnTheScreen();
  });
});

describe('categories', () => {
  it('adds a custom category, refuses a duplicate, and edits a category (type stays locked)', async () => {
    await startApp('/categories');
    expect(await screen.findByLabelText('Food')).toBeOnTheScreen();

    await press('Add category');
    await typeInto('Name', 'Gifts');
    await press('gift');
    await press('Save');
    expect(await screen.findByLabelText('Gifts')).toBeOnTheScreen();

    await press('Add category');
    await typeInto('Name', ' food ');
    await press('Save');
    expect(await screen.findByText('A category with this name already exists.')).toBeOnTheScreen();
    await goTo('/categories');

    await press('Food');
    expect(await screen.findByText('The type cannot be changed once the category exists.')).toBeOnTheScreen();
    await typeInto('Name', 'Groceries');
    await press('Save');
    expect(await screen.findByLabelText('Groceries')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Food')).toBeNull();
  });

  it('a new category can be used for a transaction', async () => {
    await startApp('/categories');
    await press('Add category');
    await typeInto('Name', 'Gifts');
    await press('Save');
    await screen.findByLabelText('Gifts');

    await goTo('/transactions/new');
    await typeInto('Title', 'Present');
    await typeInto('Amount (FCFA)', '5000');
    await press('Gifts');
    await press('Save');
    const [saved] = await getAllTransactions(await openDatabaseAsync());
    expect(saved.title).toBe('Present');
  });
});
