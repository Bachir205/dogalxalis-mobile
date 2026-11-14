import { HttpError, notFound } from '../errors';
import type { JsonStore } from '../repositories/store';
import type { Transaction } from '../types';

export function listTransactions(store: JsonStore): Transaction[] {
  return store.data.transactions;
}

export function getTransaction(store: JsonStore, id: string): Transaction {
  const item = store.data.transactions.find((entry) => entry.id === id);
  if (!item) throw notFound('Transaction');
  return item;
}

/** Same rule as the app: the category must exist and have the transaction's type. */
function assertCategory(store: JsonStore, input: Transaction) {
  const category = store.data.categories.find((item) => item.id === input.categoryId);
  if (!category) throw new HttpError(400, 'CATEGORY_NOT_FOUND', 'The category does not exist');
  if (category.type !== input.type) {
    throw new HttpError(400, 'CATEGORY_TYPE_MISMATCH', 'The category type does not match the transaction type');
  }
}

export async function createTransaction(store: JsonStore, input: Transaction) {
  const existing = store.data.transactions.find((item) => item.id === input.id);
  if (existing) return { item: existing, created: false };
  assertCategory(store, input);
  store.data.transactions.push(input);
  await store.save();
  return { item: input, created: true };
}

export async function updateTransaction(store: JsonStore, id: string, input: Transaction): Promise<Transaction> {
  if (input.id !== id) throw new HttpError(400, 'ID_MISMATCH', 'The id in the body must match the URL');
  const index = store.data.transactions.findIndex((item) => item.id === id);
  if (index === -1) throw notFound('Transaction');
  assertCategory(store, input);
  store.data.transactions[index] = input;
  await store.save();
  return input;
}

export async function deleteTransaction(store: JsonStore, id: string): Promise<void> {
  const index = store.data.transactions.findIndex((item) => item.id === id);
  if (index === -1) throw notFound('Transaction');
  store.data.transactions.splice(index, 1);
  await store.save();
}
