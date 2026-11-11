import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

// The real drawer needs native animation: swap it for a plain stub (see the file header).
jest.mock('react-native-drawer-layout', () => require('../setup/drawerLayoutMock'));

// Force English so the assertions do not depend on the machine's language.
jest.mock('@/i18n/device', () => ({ detectDeviceLanguage: () => 'en' }));

const APP_DIR = 'src/app';

describe('navigation: tabs, drawer and stack', () => {
  it('opens on Home at "/"', async () => {
    await renderRouter(APP_DIR);
    expect(screen).toHavePathname('/');
    expect(await screen.findByText(/Totals, recent transactions/)).toBeOnTheScreen();
  });

  it('switches between the four bottom tabs', async () => {
    await renderRouter(APP_DIR);

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
    await renderRouter(APP_DIR);

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
    await renderRouter(APP_DIR);

    await fireEvent.press(screen.getByLabelText('Add transaction'));
    expect(screen).toHavePathname('/transactions/new');
    expect(await screen.findByText('The transaction form is built in Phase 4.')).toBeOnTheScreen();
  });

  it('goes from the Transactions tab to details and edit with a route parameter', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/transactions' });

    await fireEvent.press(screen.getByText('Open a sample transaction (navigation test)'));
    expect(screen).toHavePathname('/transactions/sample');
    expect(await screen.findByText('Transaction id: sample')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Edit this transaction'));
    expect(screen).toHavePathname('/transactions/edit/sample');
  });

  it('opens the budget form from the Budgets tab', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/budgets' });
    await fireEvent.press(screen.getByText('Add budget'));
    expect(screen).toHavePathname('/budgets/form');
  });

  it('opens the category form in edit mode when an id is given', async () => {
    await renderRouter(APP_DIR, { initialUrl: '/categories/form?id=cat_food' });
    expect(await screen.findByText('Editing category: cat_food')).toBeOnTheScreen();
  });
});
