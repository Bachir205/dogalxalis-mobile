import { router } from 'expo-router';
import { act, fireEvent, screen, waitFor } from 'expo-router/testing-library';
import { Alert } from 'react-native';

import { getToday } from '@/utils/date';

import { press, startApp, typeInto } from '../setup/app';
import { FakeApi } from '../setup/fakeApi';
import { seedTransaction } from '../setup/seed';

// The app asks getApiClient() for its server: in these tests it is a fake in-memory server.
let mockApi: FakeApi | null = null;
jest.mock('@/services/api', () => ({
  ...jest.requireActual('@/services/api'),
  getApiClient: () => mockApi,
}));

beforeEach(() => {
  mockApi = null;
});

async function goTo(url: string) {
  await act(async () => {
    router.navigate(url as never);
  });
}

async function addLunch() {
  await press('Add transaction');
  await screen.findByLabelText('Title');
  await typeInto('Title', 'Lunch');
  await typeInto('Amount (FCFA)', '2500');
  await press('Food');
  await press('Save');
  await screen.findByText('Lunch');
}

const serverTransaction = {
  id: 'server-1',
  title: 'Server lunch',
  amountMinor: 1200,
  currency: 'XOF' as const,
  type: 'expense' as const,
  categoryId: 'cat_food',
  description: null,
  date: getToday(),
  createdAt: '2026-11-10T08:00:00.000Z',
  updatedAt: '2026-11-10T08:00:00.000Z',
};

describe('without a server', () => {
  it('works offline: Settings explains it, and no sync badge appears', async () => {
    await seedTransaction({ title: 'Local lunch' });
    await startApp('/settings');
    expect(await screen.findByText(/No server is configured/)).toBeOnTheScreen();
    expect(screen.queryByLabelText('Sync now')).toBeNull();

    await goTo('/');
    expect(await screen.findByText('Local lunch')).toBeOnTheScreen();
    expect(screen.queryByText('Pending')).toBeNull();
  });
});

describe('with a server', () => {
  it('pulls the server data into the app at startup and reports it in Settings', async () => {
    mockApi = new FakeApi();
    mockApi.transactions.set('server-1', serverTransaction);
    await startApp();
    expect(await screen.findByText('Server lunch')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Settings'));
    expect(await screen.findByText('Up to date with the server.')).toBeOnTheScreen();
    expect(screen.getByText(/Last synchronization:/)).toBeOnTheScreen();
    expect(screen.getByText('Waiting to be sent: 0')).toBeOnTheScreen();
  });

  it('sends a new transaction to the server by itself, and the Pending badge goes away', async () => {
    mockApi = new FakeApi();
    await startApp();
    await addLunch();

    await waitFor(() => expect(mockApi?.transactions.size).toBe(1));
    expect([...(mockApi?.transactions.values() ?? [])][0]).toMatchObject({ title: 'Lunch', amountMinor: 2500, categoryId: 'cat_food' });
    await waitFor(() => expect(screen.queryByText('Pending')).toBeNull());
  });

  it('offline: the change stays on the phone as Pending, and "Sync now" sends it when the server is back', async () => {
    mockApi = new FakeApi();
    mockApi.offline = true;
    await startApp();
    await addLunch();

    expect(await screen.findByText('Pending')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Settings'));
    expect(await screen.findByText(/The server cannot be reached/)).toBeOnTheScreen();
    expect(screen.getByText('Waiting to be sent: 1')).toBeOnTheScreen();
    expect(mockApi.transactions.size).toBe(0);

    mockApi.offline = false;
    await press('Sync now');
    expect(await screen.findByText('Up to date with the server.')).toBeOnTheScreen();
    expect(screen.getByText('Waiting to be sent: 0')).toBeOnTheScreen();
    expect(mockApi.transactions.size).toBe(1);

    await fireEvent.press(screen.getByText('Home'));
    expect(screen.queryByText('Pending')).toBeNull();
    expect(screen.getByText('Lunch')).toBeOnTheScreen(); // never lost, never duplicated
  });

  it('a server refusal shows a Rejected badge and a counter, and keeps the data on the phone', async () => {
    mockApi = new FakeApi();
    mockApi.rejectAllWrites = true;
    await startApp();
    await addLunch();

    expect(await screen.findByText('Rejected')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Settings'));
    expect(await screen.findByText('Refused by the server: 1')).toBeOnTheScreen();
    expect(mockApi.transactions.size).toBe(0);

    mockApi.rejectAllWrites = false;
    await press('Sync now');
    await waitFor(() => expect(mockApi?.transactions.size).toBe(1));
    expect(await screen.findByText('Waiting to be sent: 0')).toBeOnTheScreen();
    expect(screen.queryByText(/Refused by the server/)).toBeNull();
  });

  it('sends a deletion to the server', async () => {
    mockApi = new FakeApi();
    await startApp();
    await addLunch();
    await waitFor(() => expect(mockApi?.transactions.size).toBe(1));

    await fireEvent.press(screen.getByText('Lunch'));
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await press('Delete');
    const buttons = alert.mock.calls[0][2] ?? [];
    await act(async () => {
      await buttons[1].onPress?.();
    });
    await waitFor(() => expect(mockApi?.transactions.size).toBe(0));
    expect(mockApi.calls.some((c) => c.startsWith('DELETE transactions/'))).toBe(true);
    alert.mockRestore();
  });

  it('sends a new budget and a new category too', async () => {
    mockApi = new FakeApi();
    await startApp('/categories');
    await press('Add category');
    await typeInto('Name', 'Gifts');
    await press('Save');
    await screen.findByLabelText('Gifts');
    await waitFor(() => expect([...(mockApi?.categories.values() ?? [])].some((c) => c.name === 'Gifts')).toBe(true));

    await goTo('/budgets');
    await fireEvent.press(await screen.findByText('Add budget'));
    await screen.findByLabelText('Monthly limit (FCFA)');
    await press('Food');
    await typeInto('Monthly limit (FCFA)', '10000');
    await press('Save');
    await waitFor(() => expect(mockApi?.budgets.size).toBe(1));
    expect([...(mockApi?.budgets.values() ?? [])][0]).toMatchObject({ categoryId: 'cat_food', amountMinor: 10000 });
  });

  it('the screens never show the loading spinner during a synchronization', async () => {
    mockApi = new FakeApi();
    await seedTransaction({ title: 'Local lunch' });
    await startApp();
    await press('Add transaction');
    await screen.findByLabelText('Title');
    await goTo('/');
    expect(screen.queryByTestId('loading-state')).toBeNull();
    await fireEvent.press(screen.getByText('Settings'));
    await press('Sync now');
    expect(screen.queryByTestId('loading-state')).toBeNull();
    await screen.findByText('Up to date with the server.');
  });
});
