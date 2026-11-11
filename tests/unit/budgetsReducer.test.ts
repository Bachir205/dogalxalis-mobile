import { budgetsReducer, createInitialBudgetsState } from '@/reducers/budgetsReducer';
import type { Budget } from '@/types';

const make = (id: string, overrides: Partial<Budget> = {}): Budget => ({
  id,
  categoryId: 'cat_food',
  amountMinor: 100000,
  currency: 'XOF',
  month: '2026-11',
  createdAt: '2026-11-01T08:00:00.000Z',
  updatedAt: '2026-11-01T08:00:00.000Z',
  syncStatus: 'synced',
  ...overrides,
});

describe('budgetsReducer', () => {
  const initial = createInitialBudgetsState(new Date(2026, 10, 15)); // 15 Nov 2026

  it('starts on the current month with no budgets', () => {
    expect(initial).toEqual({ items: [], selectedMonth: '2026-11', status: 'ready', error: null });
  });

  it('adds, updates and removes budgets', () => {
    let state = budgetsReducer(initial, { type: 'ADDED', item: make('a') });
    state = budgetsReducer(state, { type: 'ADDED', item: make('b', { categoryId: 'cat_bills' }) });
    expect(state.items.map((b) => b.id)).toEqual(['b', 'a']);

    state = budgetsReducer(state, {
      type: 'UPDATED',
      id: 'a',
      changes: { amountMinor: 80000 },
      updatedAt: '2026-11-02T00:00:00.000Z',
    });
    expect(state.items.find((b) => b.id === 'a')).toMatchObject({
      amountMinor: 80000,
      syncStatus: 'pending',
    });

    state = budgetsReducer(state, { type: 'REMOVED', id: 'b' });
    expect(state.items.map((b) => b.id)).toEqual(['a']);
  });

  it('selects and shifts the month, including across a year', () => {
    let state = budgetsReducer(initial, { type: 'SELECT_MONTH', month: '2026-01' });
    expect(state.selectedMonth).toBe('2026-01');
    state = budgetsReducer(state, { type: 'SHIFT_MONTH', delta: -1 });
    expect(state.selectedMonth).toBe('2025-12');
    state = budgetsReducer(state, { type: 'SHIFT_MONTH', delta: 2 });
    expect(state.selectedMonth).toBe('2026-02');
  });

  it('ignores an invalid month', () => {
    const state = budgetsReducer(initial, { type: 'SELECT_MONTH', month: '2026-99' });
    expect(state.selectedMonth).toBe('2026-11');
  });

  it('keeps budgets when a load fails', () => {
    const withData = budgetsReducer(initial, { type: 'ADDED', item: make('a') });
    const failed = budgetsReducer(withData, { type: 'LOAD_FAILURE', error: 'x' });
    expect(failed.status).toBe('error');
    expect(failed.items).toHaveLength(1);
  });
});
