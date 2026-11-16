import { useCallback, useState } from 'react';

import { useBudgets } from './useBudgets';
import { useCategories } from './useCategories';
import { useSync } from './useSync';
import { useTransactions } from './useTransactions';

/**
 * Pull down on a screen to refresh it: with a server configured it runs a synchronization,
 * otherwise it simply re-reads the data saved on the phone.
 */
export function usePullToRefresh() {
  const { apiConfigured, syncNow } = useSync();
  const { reload: reloadCategories } = useCategories();
  const { reload: reloadTransactions } = useTransactions();
  const { reload: reloadBudgets } = useBudgets();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (apiConfigured) await syncNow();
      else await Promise.all([reloadCategories(), reloadTransactions(), reloadBudgets()]);
    } finally {
      setRefreshing(false);
    }
  }, [apiConfigured, syncNow, reloadCategories, reloadTransactions, reloadBudgets]);

  return { refreshing, onRefresh };
}
