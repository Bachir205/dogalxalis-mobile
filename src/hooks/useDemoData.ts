import { useCallback, useEffect, useState } from 'react';

import type { DemoCounts } from '@/database/repositories/demoRepository';
import { countDemo, loadDemoData, removeDemoData } from '@/services/demoData';
import { notifyLocalChange } from '@/services/syncEvents';

import { useBudgets } from './useBudgets';
import { useCategories } from './useCategories';
import { useDatabase } from './useDatabase';
import { usePreferences } from './usePreferences';
import { useTransactions } from './useTransactions';

const NONE: DemoCounts = { transactions: 0, budgets: 0 };

/** Load / remove the sample data from Settings, and know how much of it is there. */
export function useDemoData() {
  const db = useDatabase();
  const { currency, language } = usePreferences();
  const { reload: reloadCategories } = useCategories();
  const { reload: reloadTransactions } = useTransactions();
  const { reload: reloadBudgets } = useBudgets();
  const [counts, setCounts] = useState<DemoCounts>(NONE);
  const [busy, setBusy] = useState(false);

  const refreshCounts = useCallback(async () => setCounts(await countDemo(db)), [db]);

  useEffect(() => {
    void refreshCounts();
  }, [refreshCounts]);

  /** After a change: show it on every screen and let the synchronization send it. */
  const afterChange = useCallback(async () => {
    await Promise.all([reloadCategories(), reloadTransactions(), reloadBudgets()]);
    await refreshCounts();
    notifyLocalChange();
  }, [reloadCategories, reloadTransactions, reloadBudgets, refreshCounts]);

  const load = useCallback(async (): Promise<DemoCounts> => {
    setBusy(true);
    try {
      const result = await loadDemoData(db, { currency, language });
      await afterChange();
      return result.added;
    } finally {
      setBusy(false);
    }
  }, [db, currency, language, afterChange]);

  const remove = useCallback(async (): Promise<DemoCounts> => {
    setBusy(true);
    try {
      const removed = await removeDemoData(db);
      await afterChange();
      return removed;
    } finally {
      setBusy(false);
    }
  }, [db, afterChange]);

  const isLoaded = counts.transactions + counts.budgets > 0;
  return { counts, isLoaded, busy, load, remove };
}
