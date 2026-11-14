import { HttpError, notFound } from '../errors';
import type { JsonStore } from '../repositories/store';
import type { Budget } from '../types';

export function listBudgets(store: JsonStore): Budget[] {
  return store.data.budgets;
}

export function getBudget(store: JsonStore, id: string): Budget {
  const item = store.data.budgets.find((entry) => entry.id === id);
  if (!item) throw notFound('Budget');
  return item;
}

/** A budget needs an existing EXPENSE category and is unique per category + month + currency. */
function assertRules(store: JsonStore, input: Budget) {
  const category = store.data.categories.find((item) => item.id === input.categoryId);
  if (!category) throw new HttpError(400, 'CATEGORY_NOT_FOUND', 'The category does not exist');
  if (category.type !== 'expense') {
    throw new HttpError(400, 'CATEGORY_TYPE_MISMATCH', 'A budget needs an expense category');
  }
  const duplicate = store.data.budgets.some(
    (item) =>
      item.id !== input.id &&
      item.categoryId === input.categoryId &&
      item.month === input.month &&
      item.currency === input.currency,
  );
  if (duplicate) {
    throw new HttpError(409, 'DUPLICATE', 'A budget already exists for this category, month and currency');
  }
}

export async function createBudget(store: JsonStore, input: Budget) {
  const existing = store.data.budgets.find((item) => item.id === input.id);
  if (existing) return { item: existing, created: false };
  assertRules(store, input);
  store.data.budgets.push(input);
  await store.save();
  return { item: input, created: true };
}

export async function updateBudget(store: JsonStore, id: string, input: Budget): Promise<Budget> {
  if (input.id !== id) throw new HttpError(400, 'ID_MISMATCH', 'The id in the body must match the URL');
  const index = store.data.budgets.findIndex((item) => item.id === id);
  if (index === -1) throw notFound('Budget');
  assertRules(store, input);
  store.data.budgets[index] = input;
  await store.save();
  return input;
}

export async function deleteBudget(store: JsonStore, id: string): Promise<void> {
  const index = store.data.budgets.findIndex((item) => item.id === id);
  if (index === -1) throw notFound('Budget');
  store.data.budgets.splice(index, 1);
  await store.save();
}
