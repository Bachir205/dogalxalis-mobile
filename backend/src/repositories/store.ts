import { promises as fs } from 'node:fs';
import path from 'node:path';

import { createDefaultCategories } from '../defaultCategories';
import type { Data } from '../types';

/**
 * Storage: all data in memory, saved to one JSON file after every change (no native database,
 * so it installs the same way on Windows, macOS and Linux). `filePath = null` keeps everything
 * in memory only (used by the tests). Writes are serialized and atomic (temp file, then rename).
 */
export class JsonStore {
  private writeQueue: Promise<void> = Promise.resolve();

  private constructor(
    public readonly data: Data,
    private readonly filePath: string | null,
  ) {}

  static async open(filePath: string | null): Promise<JsonStore> {
    if (filePath) {
      try {
        const raw = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(raw) as Partial<Data>;
        return new JsonStore(
          {
            categories: parsed.categories ?? createDefaultCategories(),
            transactions: parsed.transactions ?? [],
            budgets: parsed.budgets ?? [],
          },
          filePath,
        );
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      }
    }
    const store = new JsonStore({ categories: createDefaultCategories(), transactions: [], budgets: [] }, filePath);
    await store.save();
    return store;
  }

  save(): Promise<void> {
    if (!this.filePath) return Promise.resolve();
    const target = this.filePath;
    const json = JSON.stringify(this.data, null, 2);
    this.writeQueue = this.writeQueue.then(async () => {
      await fs.mkdir(path.dirname(target), { recursive: true });
      const temp = `${target}.tmp`;
      await fs.writeFile(temp, json, 'utf8');
      await fs.rename(temp, target);
    });
    return this.writeQueue;
  }
}
