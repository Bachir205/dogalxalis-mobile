import {
  countUnsynced,
  getPendingBudgets,
  getPendingCategories,
  getPendingTransactions,
  getSyncStates,
  markFailed,
  markPending,
  markSynced,
  purgeDeleted,
  upsertBudgetFromServer,
  upsertCategoryFromServer,
  upsertTransactionFromServer,
  type SyncTable,
} from '@/database/repositories/syncRepository';
import type { Db } from '@/database/types';

import { ApiError, isHttpClientError, isNotFound, type ApiClient } from './api';
import { toApiBudget, toApiCategory, toApiTransaction } from './apiMappers';

/** synced = everything is up to date; offline = server unreachable; error = server problem. */
export type SyncOutcome = 'synced' | 'offline' | 'error';

export interface SyncResult {
  outcome: SyncOutcome;
  /** Local changes the server accepted. */
  pushed: number;
  /** Local changes the server refused (they stay on the phone, marked "failed"). */
  rejected: number;
  /** Records received from the server and saved locally. */
  pulled: number;
  /** Server records that could not be saved locally (e.g. a conflicting name). */
  skipped: number;
  error?: ApiError;
}

interface Counters {
  pushed: number;
  rejected: number;
  pulled: number;
  skipped: number;
}

/**
 * Local-first synchronization, in two steps:
 *   1. PUSH  the rows waiting to be sent (categories first, because the server checks them).
 *   2. PULL  the server's data and merge it into SQLite.
 * SQLite stays the source of truth. A network problem stops the run and keeps everything
 * pending; a refusal (4xx) marks only that row as "failed". Running it twice never duplicates.
 */
export async function runSync(db: Db, api: ApiClient): Promise<SyncResult> {
  const counters: Counters = { pushed: 0, rejected: 0, pulled: 0, skipped: 0 };
  try {
    await pushCategories(db, api, counters);
    await pushBudgets(db, api, counters);
    await pushTransactions(db, api, counters);

    await pull(db, 'categories', () => api.listCategories(), upsertCategoryFromServer, counters);
    await pull(db, 'budgets', () => api.listBudgets(), upsertBudgetFromServer, counters);
    await pull(db, 'transactions', () => api.listTransactions(), upsertTransactionFromServer, counters);
    return { outcome: 'synced', ...counters };
  } catch (error) {
    if (error instanceof ApiError) {
      const outcome: SyncOutcome = error.kind === 'network' || error.kind === 'timeout' ? 'offline' : 'error';
      return { outcome, ...counters, error };
    }
    throw error; // a local (database) problem: let the caller report it
  }
}

/** Sends one change. Returns normally when handled; throws only for "stop the whole run" errors. */
async function pushOne(
  db: Db,
  table: SyncTable,
  id: string,
  updatedAt: string,
  counters: Counters,
  operations: { save: () => Promise<unknown>; create: () => Promise<unknown>; remove?: () => Promise<void>; deleted: boolean },
): Promise<void> {
  try {
    if (operations.deleted && operations.remove) {
      try {
        await operations.remove();
      } catch (error) {
        if (!isNotFound(error)) throw error; // 404 = the server already does not have it: fine
      }
      await purgeDeleted(db, table as 'transactions' | 'budgets', id, updatedAt);
    } else {
      try {
        await operations.save(); // PUT: replaces the server copy
      } catch (error) {
        if (!isNotFound(error)) throw error;
        await operations.create(); // the server never saw it: POST
      }
      await markSynced(db, table, id, updatedAt);
    }
    counters.pushed += 1;
  } catch (error) {
    if (isHttpClientError(error)) {
      await markFailed(db, table, id, updatedAt);
      counters.rejected += 1;
      return;
    }
    throw error;
  }
}

async function pushCategories(db: Db, api: ApiClient, counters: Counters) {
  for (const category of await getPendingCategories(db)) {
    const body = toApiCategory(category);
    await pushOne(db, 'categories', category.id, category.updatedAt, counters, {
      deleted: false,
      save: () => api.updateCategory(category.id, body),
      create: () => api.createCategory(body),
    });
  }
}

async function pushBudgets(db: Db, api: ApiClient, counters: Counters) {
  for (const { record, deleted } of await getPendingBudgets(db)) {
    const body = toApiBudget(record);
    await pushOne(db, 'budgets', record.id, record.updatedAt, counters, {
      deleted,
      save: () => api.updateBudget(record.id, body),
      create: () => api.createBudget(body),
      remove: () => api.deleteBudget(record.id),
    });
  }
}

async function pushTransactions(db: Db, api: ApiClient, counters: Counters) {
  for (const { record, deleted } of await getPendingTransactions(db)) {
    const body = toApiTransaction(record);
    await pushOne(db, 'transactions', record.id, record.updatedAt, counters, {
      deleted,
      save: () => api.updateTransaction(record.id, body),
      create: () => api.createTransaction(body),
      remove: () => api.deleteTransaction(record.id),
    });
  }
}

/**
 * Merge rule: a local change that has not been sent yet always wins (it is pushed on the next
 * run). A row that is already in sync takes the server's version. A server row we do not
 * have is added. A row we believed in sync but the server lost is sent again.
 */
async function pull<T extends { id: string }>(
  db: Db,
  table: SyncTable,
  fetchAll: () => Promise<T[]>,
  upsert: (db: Db, item: T) => Promise<void>,
  counters: Counters,
): Promise<void> {
  const serverItems = await fetchAll();
  const states = await getSyncStates(db, table);
  const serverIds = new Set(serverItems.map((item) => item.id));

  await db.withTransactionAsync(async () => {
    for (const item of serverItems) {
      const state = states.get(item.id);
      const takeServerVersion = !state || (state.syncStatus === 'synced' && !state.deleted);
      if (!takeServerVersion) continue; // pending / failed / deleted locally: keep the local one
      try {
        await upsert(db, item);
        counters.pulled += 1;
      } catch (error) {
        console.warn(`Skipped a ${table} record from the server`, error);
        counters.skipped += 1;
      }
    }
    for (const [id, state] of states) {
      if (state.syncStatus === 'synced' && !state.deleted && !serverIds.has(id)) {
        await markPending(db, table, id);
      }
    }
  });
}

export { countUnsynced };
