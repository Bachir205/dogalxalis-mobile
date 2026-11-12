import * as SQLite from 'expo-sqlite';

import { runMigrations } from './migrations';
import type { Db } from './types';

const DATABASE_NAME = 'dogalxalis.db';

let connection: Promise<Db> | null = null;

/** Opens the database once, applies pending migrations, and reuses the same connection. */
export function getDatabase(): Promise<Db> {
  if (!connection) {
    connection = (async () => {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      await runMigrations(db);
      return db;
    })().catch((error) => {
      connection = null; // allow a retry after a failure
      throw error;
    });
  }
  return connection;
}

/** For tests: forget the cached connection so the next call opens a fresh one. */
export function resetDatabaseConnection(): void {
  connection = null;
}
