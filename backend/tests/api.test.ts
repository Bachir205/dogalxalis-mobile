import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { createApp } from '../src/app';
import { JsonStore } from '../src/repositories/store';

let close: () => Promise<void>;
let url: string;

async function start(store: JsonStore) {
  const server = createApp(store).listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  close = () => new Promise((resolve) => server.close(() => resolve()));
}

beforeEach(async () => {
  await start(await JsonStore.open(null));
});
afterEach(async () => {
  await close();
});

async function call(method: string, route: string, body?: unknown) {
  const response = await fetch(`${url}${route}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  const text = await response.text();
  return { status: response.status, json: text ? JSON.parse(text) : null };
}

const NOW = '2026-11-10T08:00:00.000Z';
const tx = (overrides: object = {}) => ({
  id: 'tx-1',
  title: 'Lunch',
  amountMinor: 2500,
  currency: 'XOF',
  type: 'expense',
  categoryId: 'cat_food',
  description: null,
  date: '2026-11-10',
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});
const budget = (overrides: object = {}) => ({
  id: 'b-1',
  categoryId: 'cat_food',
  amountMinor: 100000,
  currency: 'XOF',
  month: '2026-11',
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});
const category = (overrides: object = {}) => ({
  id: 'c-1',
  name: 'Gifts',
  type: 'expense',
  icon: 'gift',
  color: '#E67E22',
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

describe('general', () => {
  it('answers the health check', async () => {
    assert.deepEqual(await call('GET', '/health'), { status: 200, json: { data: { status: 'ok' } } });
  });

  it('answers unknown routes with a JSON 404', async () => {
    const { status, json } = await call('GET', '/nope');
    assert.equal(status, 404);
    assert.equal(json.error.code, 'NOT_FOUND');
  });

  it('rejects invalid JSON with 400', async () => {
    const { status, json } = await call('POST', '/transactions', '{ not json');
    assert.equal(status, 400);
    assert.equal(json.error.code, 'INVALID_JSON');
  });

  it('rejects a missing body with a validation error', async () => {
    const { status, json } = await call('POST', '/transactions');
    assert.equal(status, 400);
    assert.equal(json.error.code, 'VALIDATION_ERROR');
  });
});

describe('categories', () => {
  it('lists the 13 default categories', async () => {
    const { status, json } = await call('GET', '/categories');
    assert.equal(status, 200);
    assert.equal(json.data.length, 13);
    assert.ok(json.data.some((c: { id: string }) => c.id === 'cat_food'));
  });

  it('creates a category (201), is idempotent for the same id (200), refuses a duplicate name (409)', async () => {
    const created = await call('POST', '/categories', category());
    assert.equal(created.status, 201);
    assert.equal(created.json.data.name, 'Gifts');

    const again = await call('POST', '/categories', category({ name: 'Something else' }));
    assert.equal(again.status, 200);
    assert.equal(again.json.data.name, 'Gifts'); // the stored one, unchanged

    const clash = await call('POST', '/categories', category({ id: 'c-2', name: ' gifts ' }));
    assert.equal(clash.status, 409);
    assert.equal(clash.json.error.code, 'DUPLICATE');

    const otherType = await call('POST', '/categories', category({ id: 'c-3', type: 'income' }));
    assert.equal(otherType.status, 201);
  });

  it('updates a category but never its type', async () => {
    await call('POST', '/categories', category());
    const renamed = await call('PUT', '/categories/c-1', category({ name: 'Presents', updatedAt: '2026-11-11T00:00:00.000Z' }));
    assert.equal(renamed.status, 200);
    assert.equal(renamed.json.data.name, 'Presents');

    const type = await call('PUT', '/categories/c-1', category({ type: 'income' }));
    assert.equal(type.status, 400);
    assert.equal(type.json.error.code, 'TYPE_IMMUTABLE');

    assert.equal((await call('PUT', '/categories/zzz', category({ id: 'zzz' }))).status, 404);
    assert.equal((await call('PUT', '/categories/c-1', category({ id: 'other' }))).json.error.code, 'ID_MISMATCH');
    assert.equal((await call('PUT', '/categories/cat_bills', category({ id: 'cat_bills', name: 'food' }))).status, 409);
  });

  it('validates the body', async () => {
    for (const bad of [{ name: '' }, { name: 'x'.repeat(31) }, { type: 'transfer' }, { color: 'red' }, { id: '' }]) {
      const { status, json } = await call('POST', '/categories', category(bad));
      assert.equal(status, 400);
      assert.equal(json.error.code, 'VALIDATION_ERROR');
    }
  });
});

describe('transactions', () => {
  it('creates, reads, lists, updates and deletes', async () => {
    const created = await call('POST', '/transactions', tx());
    assert.equal(created.status, 201);
    assert.deepEqual(created.json.data, tx());

    assert.deepEqual((await call('GET', '/transactions/tx-1')).json.data, tx());
    assert.equal((await call('GET', '/transactions')).json.data.length, 1);

    const updated = await call('PUT', '/transactions/tx-1', tx({ title: 'Dinner', amountMinor: 4000, updatedAt: '2026-11-11T00:00:00.000Z' }));
    assert.equal(updated.status, 200);
    assert.equal(updated.json.data.title, 'Dinner');
    assert.equal((await call('GET', '/transactions/tx-1')).json.data.amountMinor, 4000);

    assert.equal((await call('DELETE', '/transactions/tx-1')).status, 204);
    assert.equal((await call('GET', '/transactions/tx-1')).status, 404);
    assert.equal((await call('DELETE', '/transactions/tx-1')).status, 404);
    assert.deepEqual((await call('GET', '/transactions')).json.data, []);
  });

  it('is idempotent: posting the same id twice never duplicates', async () => {
    assert.equal((await call('POST', '/transactions', tx())).status, 201);
    const again = await call('POST', '/transactions', tx({ title: 'Changed' }));
    assert.equal(again.status, 200);
    assert.equal(again.json.data.title, 'Lunch');
    assert.equal((await call('GET', '/transactions')).json.data.length, 1);
  });

  it('answers 404 when updating something that does not exist', async () => {
    const { status, json } = await call('PUT', '/transactions/tx-9', tx({ id: 'tx-9' }));
    assert.equal(status, 404);
    assert.equal(json.error.code, 'NOT_FOUND');
  });

  it('refuses an unknown category and a category of the wrong type', async () => {
    const unknown = await call('POST', '/transactions', tx({ categoryId: 'nope' }));
    assert.equal(unknown.status, 400);
    assert.equal(unknown.json.error.code, 'CATEGORY_NOT_FOUND');

    const mismatch = await call('POST', '/transactions', tx({ type: 'income' }));
    assert.equal(mismatch.status, 400);
    assert.equal(mismatch.json.error.code, 'CATEGORY_TYPE_MISMATCH');

    await call('POST', '/transactions', tx());
    const badUpdate = await call('PUT', '/transactions/tx-1', tx({ type: 'income' }));
    assert.equal(badUpdate.json.error.code, 'CATEGORY_TYPE_MISMATCH');
  });

  it('validates amounts, dates, currencies and unknown fields', async () => {
    const bads = [
      { amountMinor: 0 },
      { amountMinor: -5 },
      { amountMinor: 10.5 },
      { amountMinor: '2500' },
      { amountMinor: 1_000_000_000_001 },
      { date: '2026-02-30' },
      { date: '10/11/2026' },
      { currency: 'GBP' },
      { title: '   ' },
      { title: 'x'.repeat(61) },
      { description: 'x'.repeat(201) },
      { syncStatus: 'pending' },
      { createdAt: 'yesterday' },
    ];
    for (const bad of bads) {
      const { status, json } = await call('POST', '/transactions', tx(bad));
      assert.equal(status, 400, JSON.stringify(bad));
      assert.equal(json.error.code, 'VALIDATION_ERROR');
      assert.ok(Array.isArray(json.error.details));
    }
    assert.deepEqual((await call('GET', '/transactions')).json.data, []);
  });

  it('refuses a PUT whose body id differs from the URL', async () => {
    await call('POST', '/transactions', tx());
    assert.equal((await call('PUT', '/transactions/tx-1', tx({ id: 'tx-2' }))).json.error.code, 'ID_MISMATCH');
  });
});

describe('budgets', () => {
  it('creates, reads, lists, updates and deletes', async () => {
    assert.equal((await call('POST', '/budgets', budget())).status, 201);
    assert.deepEqual((await call('GET', '/budgets/b-1')).json.data, budget());
    assert.equal((await call('GET', '/budgets')).json.data.length, 1);

    const updated = await call('PUT', '/budgets/b-1', budget({ amountMinor: 80000 }));
    assert.equal(updated.status, 200);
    assert.equal(updated.json.data.amountMinor, 80000);

    assert.equal((await call('DELETE', '/budgets/b-1')).status, 204);
    assert.equal((await call('GET', '/budgets/b-1')).status, 404);
    assert.equal((await call('DELETE', '/budgets/b-1')).status, 404);
  });

  it('is idempotent for the same id', async () => {
    await call('POST', '/budgets', budget());
    const again = await call('POST', '/budgets', budget({ amountMinor: 1 }));
    assert.equal(again.status, 200);
    assert.equal(again.json.data.amountMinor, 100000);
  });

  it('accepts expense categories only', async () => {
    const income = await call('POST', '/budgets', budget({ categoryId: 'cat_salary' }));
    assert.equal(income.status, 400);
    assert.equal(income.json.error.code, 'CATEGORY_TYPE_MISMATCH');
    assert.equal((await call('POST', '/budgets', budget({ categoryId: 'nope' }))).json.error.code, 'CATEGORY_NOT_FOUND');
  });

  it('refuses a duplicate (category, month, currency) with 409, also when updating', async () => {
    await call('POST', '/budgets', budget());
    const clash = await call('POST', '/budgets', budget({ id: 'b-2' }));
    assert.equal(clash.status, 409);
    assert.equal(clash.json.error.code, 'DUPLICATE');

    assert.equal((await call('POST', '/budgets', budget({ id: 'b-2', month: '2026-12' }))).status, 201);
    assert.equal((await call('PUT', '/budgets/b-2', budget({ id: 'b-2', month: '2026-11' }))).status, 409);
    assert.equal((await call('POST', '/budgets', budget({ id: 'b-3', currency: 'EUR' }))).status, 201);
  });

  it('validates month and amount', async () => {
    for (const bad of [{ month: '2026-13' }, { month: 'nov' }, { month: '2026-1' }, { amountMinor: 0 }, { amountMinor: 1.5 }]) {
      assert.equal((await call('POST', '/budgets', budget(bad))).status, 400, JSON.stringify(bad));
    }
  });
});

describe('storage', () => {
  it('keeps the data in a JSON file and reloads it (data survives a server restart)', async () => {
    const file = path.join(await fs.mkdtemp(path.join(os.tmpdir(), 'dogalxalis-')), 'db.json');
    await close();
    await start(await JsonStore.open(file));
    await call('POST', '/transactions', tx());
    await call('POST', '/budgets', budget());
    await call('POST', '/categories', category());
    await close();

    const saved = JSON.parse(await fs.readFile(file, 'utf8'));
    assert.equal(saved.transactions.length, 1);
    assert.equal(saved.categories.length, 14);

    await start(await JsonStore.open(file)); // "restart"
    assert.equal((await call('GET', '/transactions')).json.data.length, 1);
    assert.equal((await call('GET', '/budgets')).json.data.length, 1);
    assert.equal((await call('GET', '/categories')).json.data.length, 14);
  });
});
