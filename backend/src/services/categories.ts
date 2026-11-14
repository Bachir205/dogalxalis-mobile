import { HttpError, notFound } from '../errors';
import type { JsonStore } from '../repositories/store';
import type { Category } from '../types';

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export function listCategories(store: JsonStore): Category[] {
  return store.data.categories;
}

function assertNameFree(store: JsonStore, input: Category) {
  const clash = store.data.categories.some(
    (item) => item.id !== input.id && item.type === input.type && sameName(item.name, input.name),
  );
  if (clash) throw new HttpError(409, 'DUPLICATE', 'A category with this name already exists');
}

/** POST is idempotent: the same id again returns the stored category (200) instead of failing. */
export async function createCategory(store: JsonStore, input: Category) {
  const existing = store.data.categories.find((item) => item.id === input.id);
  if (existing) return { item: existing, created: false };
  assertNameFree(store, input);
  store.data.categories.push(input);
  await store.save();
  return { item: input, created: true };
}

export async function updateCategory(store: JsonStore, id: string, input: Category): Promise<Category> {
  if (input.id !== id) throw new HttpError(400, 'ID_MISMATCH', 'The id in the body must match the URL');
  const index = store.data.categories.findIndex((item) => item.id === id);
  if (index === -1) throw notFound('Category');
  if (store.data.categories[index].type !== input.type) {
    throw new HttpError(400, 'TYPE_IMMUTABLE', 'The type of a category cannot be changed');
  }
  assertNameFree(store, input);
  store.data.categories[index] = input;
  await store.save();
  return input;
}
