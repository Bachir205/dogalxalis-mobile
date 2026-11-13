import type { Category, SyncStatus, TransactionType } from '@/types';

import { DataError } from '../errors';
import { isUniqueViolation } from '../rules';
import type { Db, SqlParams } from '../types';

interface CategoryRow {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string | null;
  created_at: string;
  updated_at: string;
  sync_status: SyncStatus;
}

function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    icon: row.icon,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
  };
}

export async function getAllCategories(db: Db): Promise<Category[]> {
  const rows = await db.getAllAsync<CategoryRow>(
    'SELECT * FROM categories ORDER BY type DESC, name COLLATE NOCASE',
    [],
  );
  return rows.map(toCategory);
}

export async function getCategoryById(db: Db, id: string): Promise<Category | null> {
  const row = await db.getFirstAsync<CategoryRow>('SELECT * FROM categories WHERE id = ?', [id]);
  return row ? toCategory(row) : null;
}

export async function insertCategory(db: Db, category: Category): Promise<void> {
  try {
    await db.runAsync(
      `INSERT INTO categories
         (id, name, type, icon, color, created_at, updated_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category.id,
        category.name,
        category.type,
        category.icon,
        category.color,
        category.createdAt,
        category.updatedAt,
        category.syncStatus,
      ],
    );
  } catch (error) {
    if (isUniqueViolation(error)) throw new DataError('DUPLICATE', 'Category name already used');
    throw error;
  }
}

/** The type of a category can never change, so only name, icon and color are editable. */
export interface CategoryChanges {
  name?: string;
  icon?: string;
  color?: string | null;
}

export async function updateCategory(
  db: Db,
  id: string,
  changes: CategoryChanges,
  updatedAt: string,
): Promise<void> {
  const sets: string[] = [];
  const params: SqlParams = [];
  if (changes.name !== undefined) {
    sets.push('name = ?');
    params.push(changes.name);
  }
  if (changes.icon !== undefined) {
    sets.push('icon = ?');
    params.push(changes.icon);
  }
  if (changes.color !== undefined) {
    sets.push('color = ?');
    params.push(changes.color);
  }
  sets.push('updated_at = ?', "sync_status = 'pending'");
  params.push(updatedAt, id);

  try {
    const result = await db.runAsync(`UPDATE categories SET ${sets.join(', ')} WHERE id = ?`, params);
    if (result.changes === 0) throw new DataError('NOT_FOUND', `Category ${id} not found`);
  } catch (error) {
    if (isUniqueViolation(error)) throw new DataError('DUPLICATE', 'Category name already used');
    throw error;
  }
}
