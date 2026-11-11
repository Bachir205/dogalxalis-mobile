import {
  initialTransactionsState,
  transactionsReducer,
  type TransactionsState,
} from '@/reducers/transactionsReducer';
import type { Transaction } from '@/types';

const make = (id: string, overrides: Partial<Transaction> = {}): Transaction => ({
  id,
  title: `Item ${id}`,
  amountMinor: 1000,
  currency: 'XOF',
  type: 'expense',
  categoryId: 'cat_food',
  description: null,
  date: '2026-11-10',
  createdAt: '2026-11-10T08:00:00.000Z',
  updatedAt: '2026-11-10T08:00:00.000Z',
  syncStatus: 'synced',
  ...overrides,
});

describe('transactionsReducer', () => {
  it('starts empty and ready', () => {
    expect(initialTransactionsState).toEqual({ items: [], status: 'ready', error: null });
  });

  it('handles the load lifecycle', () => {
    const loading = transactionsReducer(initialTransactionsState, { type: 'LOAD_START' });
    expect(loading.status).toBe('loading');
    const ready = transactionsReducer(loading, { type: 'LOAD_SUCCESS', items: [make('a')] });
    expect(ready).toEqual({ items: [make('a')], status: 'ready', error: null });
    const failed = transactionsReducer(ready, { type: 'LOAD_FAILURE', error: 'boom' });
    expect(failed.status).toBe('error');
    expect(failed.error).toBe('boom');
    expect(failed.items).toHaveLength(1); // data already shown stays visible
  });

  it('adds the newest item first and never duplicates an id', () => {
    let state = transactionsReducer(initialTransactionsState, { type: 'ADDED', item: make('a') });
    state = transactionsReducer(state, { type: 'ADDED', item: make('b') });
    expect(state.items.map((i) => i.id)).toEqual(['b', 'a']);
    state = transactionsReducer(state, { type: 'ADDED', item: make('a', { title: 'again' }) });
    expect(state.items.map((i) => i.id)).toEqual(['a', 'b']);
    expect(state.items[0].title).toBe('again');
  });

  it('updates only the targeted item and marks it pending', () => {
    const start: TransactionsState = { ...initialTransactionsState, items: [make('a'), make('b')] };
    const next = transactionsReducer(start, {
      type: 'UPDATED',
      id: 'a',
      changes: { amountMinor: 2500, categoryId: 'cat_transport' },
      updatedAt: '2026-11-11T09:00:00.000Z',
    });
    expect(next.items[0]).toMatchObject({
      amountMinor: 2500,
      categoryId: 'cat_transport',
      updatedAt: '2026-11-11T09:00:00.000Z',
      syncStatus: 'pending',
    });
    expect(next.items[1]).toEqual(make('b'));
  });

  it('ignores updates for an unknown id', () => {
    const start: TransactionsState = { ...initialTransactionsState, items: [make('a')] };
    const next = transactionsReducer(start, {
      type: 'UPDATED',
      id: 'zzz',
      changes: { title: 'x' },
      updatedAt: 'now',
    });
    expect(next.items).toEqual(start.items);
  });

  it('removes an item and sets a sync status', () => {
    const start: TransactionsState = { ...initialTransactionsState, items: [make('a'), make('b')] };
    expect(transactionsReducer(start, { type: 'REMOVED', id: 'a' }).items.map((i) => i.id)).toEqual(['b']);
    const synced = transactionsReducer(
      { ...start, items: [make('a', { syncStatus: 'pending' })] },
      { type: 'SYNC_STATUS_SET', id: 'a', syncStatus: 'synced' },
    );
    expect(synced.items[0].syncStatus).toBe('synced');
  });

  it('does not mutate the previous state', () => {
    const start: TransactionsState = { ...initialTransactionsState, items: [make('a')] };
    const frozen = Object.freeze({ ...start, items: Object.freeze([...start.items]) as Transaction[] });
    expect(() => transactionsReducer(frozen, { type: 'ADDED', item: make('b') })).not.toThrow();
    expect(frozen.items).toHaveLength(1);
  });
});
