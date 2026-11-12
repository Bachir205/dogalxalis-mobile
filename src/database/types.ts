export type SqlValue = string | number | null;
export type SqlParams = SqlValue[];

/**
 * The few database operations the app uses. expo-sqlite's database matches this shape, and the
 * tests plug in a pure-JavaScript SQLite (sql.js), so the same SQL runs in both.
 */
export interface Db {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params: SqlParams): Promise<{ changes: number }>;
  getAllAsync<T>(sql: string, params: SqlParams): Promise<T[]>;
  getFirstAsync<T>(sql: string, params: SqlParams): Promise<T | null>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}
