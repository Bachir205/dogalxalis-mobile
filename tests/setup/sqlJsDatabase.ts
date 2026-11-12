/**
 * Test database: real SQLite (sql.js, pure JavaScript) behind the same small interface the app
 * uses for expo-sqlite. The app's SQL, constraints, indexes and migrations run unchanged.
 */
import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';

import type { Db, SqlParams } from '@/database/types';

let sqlJs: ReturnType<typeof initSqlJs> | null = null;
const loadSqlJs = () => (sqlJs ??= initSqlJs());

export class SqlJsDb implements Db {
  constructor(private readonly database: SqlJsDatabase) {}

  async execAsync(sql: string): Promise<void> {
    this.database.exec(sql);
  }

  async runAsync(sql: string, params: SqlParams): Promise<{ changes: number }> {
    this.database.run(sql, params);
    return { changes: this.database.getRowsModified() };
  }

  async getAllAsync<T>(sql: string, params: SqlParams): Promise<T[]> {
    const statement = this.database.prepare(sql);
    try {
      statement.bind(params);
      const rows: T[] = [];
      while (statement.step()) rows.push(statement.getAsObject() as T);
      return rows;
    } finally {
      statement.free();
    }
  }

  async getFirstAsync<T>(sql: string, params: SqlParams): Promise<T | null> {
    const rows = await this.getAllAsync<T>(sql, params);
    return rows[0] ?? null;
  }

  async withTransactionAsync(task: () => Promise<void>): Promise<void> {
    this.database.run('BEGIN');
    try {
      await task();
      this.database.run('COMMIT');
    } catch (error) {
      this.database.run('ROLLBACK');
      throw error;
    }
  }
}

export async function createSqlJsDb(): Promise<SqlJsDb> {
  const SQL = await loadSqlJs();
  return new SqlJsDb(new SQL.Database());
}
