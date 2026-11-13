import { router } from 'expo-router';
import { act, fireEvent, screen } from 'expo-router/testing-library';
import { Alert } from 'react-native';

import { getAllBudgets } from '@/database/repositories/budgetRepository';
import { getCurrentMonth, shiftMonth } from '@/utils/date';

import { press, startApp, typeInto } from '../setup/app';
import { flushPromises } from '../setup/helpers';
import { seedBudget, seedTransaction } from '../setup/seed';
import { openDatabaseAsync } from '../setup/sqliteMock';

async function goTo(url: string) {
  await act(async () => {
    router.navigate(url as never);
  });
}

/** Adds an expense in the Food category through the real form, then returns to the previous screen. */
async function addFoodExpense(title: string, amount: string) {
  await goTo('/transactions/new');
  await screen.findByLabelText('Title');
  await typeInto('Title', title);
  await typeInto('Amount (FCFA)', amount);
  await press('Food');
  await press('Save');
}

describe('creating a budget', () => {
  it('creates a monthly Food budget from the Budgets tab and stores it in SQLite', async () => {
    await startApp('/budgets');
    expect(await screen.findByText('No budgets this month')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Add budget'));
    await screen.findByLabelText('Monthly limit (FCFA)');
    await press('Food');
    await typeInto('Monthly limit (FCFA)', '10000');
    await press('Save');

    expect(await screen.findByText('0 FCFA of 10,000 FCFA')).toBeOnTheScreen();
    expect(screen.getByText('Normal')).toBeOnTheScreen();
    expect(screen.getByLabelText('Allocated: 10,000 FCFA')).toBeOnTheScreen();
    expect(screen.getByLabelText('Spent: 0 FCFA')).toBeOnTheScreen();
    expect(screen.getByLabelText('Remaining: 10,000 FCFA')).toBeOnTheScreen();
    expect(screen.getByLabelText('Budgets: 1')).toBeOnTheScreen();

    const saved = await getAllBudgets(await openDatabaseAsync());
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ categoryId: 'cat_food', amountMinor: 10000, currency: 'XOF', month: getCurrentMonth() });
  });

  it('only offers expense categories', async () => {
    await startApp('/budgets');
    await fireEvent.press(screen.getByText('Add budget'));
    expect(await screen.findByLabelText('Food')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Salary')).toBeNull();
  });

  it('shows validation errors and saves nothing for an incomplete form', async () => {
    await startApp('/budgets');
    await fireEvent.press(screen.getByText('Add budget'));
    await screen.findByLabelText('Monthly limit (FCFA)');
    await press('Save');
    expect(await screen.findByText('Choose a category.')).toBeOnTheScreen();
    expect(screen.getByText('Enter an amount.')).toBeOnTheScreen();

    await press('Food');
    await typeInto('Monthly limit (FCFA)', '0');
    await press('Save');
    expect(await screen.findByText('The amount must be greater than zero.')).toBeOnTheScreen();
    expect(await getAllBudgets(await openDatabaseAsync())).toEqual([]);
  });

  it('refuses a duplicate budget, then accepts the same category for another month', async () => {
    await seedBudget();
    await startApp('/budgets');
    await press('Add budget');
    await screen.findByLabelText('Monthly limit (FCFA)');
    await press('Food');
    await typeInto('Monthly limit (FCFA)', '5000');
    await press('Save');
    expect(
      await screen.findByText('A budget already exists for this category, month and currency.'),
    ).toBeOnTheScreen();
    expect(await getAllBudgets(await openDatabaseAsync())).toHaveLength(1);

    await press('Next month');
    await press('Save');
    await flushPromises();
    expect(await getAllBudgets(await openDatabaseAsync())).toHaveLength(2);
  });
});

describe('budget progress follows the expenses', () => {
  it('shows spent, remaining, percentage and status, and updates after each new expense', async () => {
    await seedBudget({ amountMinor: 10000 });
    await seedTransaction({ amountMinor: 8500, title: 'Groceries' });
    await startApp('/budgets');

    expect(await screen.findByText('85%')).toBeOnTheScreen();
    expect(screen.getByText('Approaching limit')).toBeOnTheScreen();
    expect(screen.getByText('8,500 FCFA of 10,000 FCFA')).toBeOnTheScreen();
    expect(screen.getByText('Remaining: 1,500 FCFA')).toBeOnTheScreen();

    await addFoodExpense('Snack', '1500');
    expect(await screen.findByText('100%')).toBeOnTheScreen();
    expect(screen.getByText('Budget reached')).toBeOnTheScreen();
    expect(screen.getByText('Remaining: 0 FCFA')).toBeOnTheScreen();

    await addFoodExpense('Treat', '500');
    expect(await screen.findByText('105%')).toBeOnTheScreen();
    expect(screen.getByText('Budget exceeded')).toBeOnTheScreen();
    expect(screen.getByText('Exceeded by 500 FCFA')).toBeOnTheScreen();
    expect(screen.getByLabelText('Remaining: -500 FCFA')).toBeOnTheScreen();
  });

  it('moves the spending to the new budget when an expense changes category', async () => {
    await seedBudget({ amountMinor: 10000, categoryId: 'cat_food' });
    await seedBudget({ amountMinor: 10000, categoryId: 'cat_transport' });
    await seedTransaction({ amountMinor: 3000, title: 'Ride', categoryId: 'cat_food' });
    await startApp('/budgets');
    expect(await screen.findByText('3,000 FCFA of 10,000 FCFA')).toBeOnTheScreen();
    expect(screen.getByText('0 FCFA of 10,000 FCFA')).toBeOnTheScreen();

    await goTo('/transactions');
    await fireEvent.press(await screen.findByText('Ride'));
    await press('Edit');
    await screen.findByDisplayValue('Ride');
    await press('Transport');
    await press('Save');
    await flushPromises();

    await goTo('/budgets');
    // Same two amounts as before, but now the 3 000 FCFA belongs to Transport.
    expect(await screen.findByLabelText(/^Transport, .*3,000 FCFA of 10,000 FCFA/)).toBeOnTheScreen();
    expect(screen.getByLabelText(/^Food, .*0 FCFA of 10,000 FCFA/)).toBeOnTheScreen();
  });

  it('does not count income, another month or another currency', async () => {
    await seedBudget({ amountMinor: 10000 });
    await seedTransaction({ amountMinor: 2000, title: 'Counted' });
    await seedTransaction({ amountMinor: 9000, title: 'Income', type: 'income', categoryId: 'cat_salary' });
    await seedTransaction({ amountMinor: 9000, title: 'Old', date: `${shiftMonth(getCurrentMonth(), -1)}-10` });
    await seedTransaction({ amountMinor: 9000, title: 'Euro', currency: 'EUR' });
    await startApp('/budgets');
    expect(await screen.findByText('2,000 FCFA of 10,000 FCFA')).toBeOnTheScreen();
    expect(screen.getByText('20%')).toBeOnTheScreen();
  });
});

describe('editing and deleting a budget', () => {
  it('edits the limit and shows the new figures', async () => {
    await seedBudget({ amountMinor: 10000 });
    await seedTransaction({ amountMinor: 2500 });
    await startApp('/budgets');
    await fireEvent.press(await screen.findByText('Food'));
    expect(await screen.findByDisplayValue('10000')).toBeOnTheScreen();

    await typeInto('Monthly limit (FCFA)', '2500');
    await press('Save');
    expect(await screen.findByText('Budget reached')).toBeOnTheScreen();
    expect(screen.getByText('2,500 FCFA of 2,500 FCFA')).toBeOnTheScreen();
    expect(screen.getByText('100%')).toBeOnTheScreen();
    expect((await getAllBudgets(await openDatabaseAsync()))[0].amountMinor).toBe(2500);
  });

  it('asks for confirmation, then deletes the budget (soft delete in SQLite)', async () => {
    await seedBudget();
    await startApp('/budgets');
    await fireEvent.press(await screen.findByText('Food'));

    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await press('Delete');
    expect(alert).toHaveBeenCalledWith(
      'Delete budget?',
      expect.stringMatching(/^Delete the Food budget for \w+ \d{4}\?$/),
      expect.any(Array),
    );
    const buttons = alert.mock.calls[0][2] ?? [];
    await act(async () => {
      await buttons[1].onPress?.();
    });

    expect(await screen.findByText('No budgets this month')).toBeOnTheScreen();
    const db = await openDatabaseAsync();
    expect(await getAllBudgets(db)).toEqual([]);
    const row = await db.getFirstAsync<{ deleted_at: string | null }>('SELECT deleted_at FROM budgets', []);
    expect(row?.deleted_at).not.toBeNull();
    alert.mockRestore();
  });
});

describe('months, dashboard and currency', () => {
  it('navigates between months', async () => {
    const lastMonth = shiftMonth(getCurrentMonth(), -1);
    await seedBudget({ month: lastMonth, categoryId: 'cat_bills' });
    await startApp('/budgets');
    expect(await screen.findByText('No budgets this month')).toBeOnTheScreen();

    await press('Previous month');
    expect(await screen.findByText('Bills')).toBeOnTheScreen();
    expect(screen.queryByText('No budgets this month')).toBeNull();

    await press('Next month');
    expect(await screen.findByText('No budgets this month')).toBeOnTheScreen();
  });

  it('shows the budget overview on the dashboard for the current month', async () => {
    await seedBudget({ amountMinor: 10000 });
    await seedTransaction({ amountMinor: 9000 });
    await startApp();
    expect(await screen.findByText('9,000 FCFA spent of 10,000 FCFA')).toBeOnTheScreen();
    expect(screen.getByText('Approaching limit')).toBeOnTheScreen();
    expect(screen.getByText('90%')).toBeOnTheScreen();
    expect(screen.getByText('Remaining: 1,000 FCFA')).toBeOnTheScreen();
  });

  it('only shows the budgets of the active currency', async () => {
    await seedBudget();
    await startApp('/settings');
    await press('EUR (€)');
    await fireEvent.press(screen.getByText('Budgets'));
    expect(await screen.findByText('No budgets this month')).toBeOnTheScreen();
  });

  it('keeps budgets after the app is closed and reopened', async () => {
    await seedBudget({ amountMinor: 10000 });
    await seedTransaction({ amountMinor: 4000 });
    await startApp('/budgets');
    expect(await screen.findByText('40%')).toBeOnTheScreen();
    await screen.unmount();
    await startApp('/budgets');
    expect(await screen.findByText('40%')).toBeOnTheScreen();
  });
});
