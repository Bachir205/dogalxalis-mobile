/**
 * Replacement for the expo-sqlite module in Jest. The "file" is one in-memory database that
 * survives while a test runs, so unmounting and remounting the app behaves like closing and
 * reopening it (the data is still there). It is reset before every test.
 */
import { createSqlJsDb, type SqlJsDb } from './sqlJsDatabase';

let current: Promise<SqlJsDb> | null = null;

export async function openDatabaseAsync(): Promise<SqlJsDb> {
  current ??= createSqlJsDb();
  return current;
}

export function resetSqliteMock(): void {
  current = null;
}
