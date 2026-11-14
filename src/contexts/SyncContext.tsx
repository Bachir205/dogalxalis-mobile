import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import { countUnsynced, type UnsyncedCounts } from '@/database/repositories/syncRepository';
import { useBudgets } from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useCategories';
import { useDatabase } from '@/hooks/useDatabase';
import { useTransactions } from '@/hooks/useTransactions';
import { getApiClient, type ApiClient } from '@/services/api';
import { onLocalChange } from '@/services/syncEvents';
import { runSync, type SyncResult } from '@/services/syncService';

/** disabled = no server configured; the rest describe the last synchronization attempt. */
export type SyncState = 'disabled' | 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

export interface SyncContextValue {
  apiConfigured: boolean;
  state: SyncState;
  /** ISO timestamp of the last successful synchronization. */
  lastSyncedAt: string | null;
  /** Local changes waiting to be sent. */
  pending: number;
  /** Local changes the server refused. */
  failed: number;
  syncNow: () => Promise<void>;
}

export const SyncContext = createContext<SyncContextValue | null>(null);

const DEBOUNCE_MS = 400;

interface SyncProviderProps {
  children: ReactNode;
  /** Replaceable in tests. undefined = the client from EXPO_PUBLIC_API_URL, null = no server. */
  api?: ApiClient | null;
}

/**
 * Runs the synchronization: once at startup, when the app comes back to the foreground, a
 * moment after every local change, and on demand ("Sync now"). Only one run at a time; a
 * request that arrives during a run triggers one more run afterwards.
 */
export function SyncProvider({ children, api }: SyncProviderProps) {
  const db = useDatabase();
  const { reload: reloadCategories } = useCategories();
  const { reload: reloadBudgets } = useBudgets();
  const { reload: reloadTransactions } = useTransactions();

  const client = useMemo(() => (api === undefined ? getApiClient() : api), [api]);
  const [state, setState] = useState<SyncState>(client ? 'idle' : 'disabled');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [counts, setCounts] = useState<UnsyncedCounts>({ pending: 0, failed: 0 });
  const running = useRef(false);
  const runAgain = useRef(false);

  const refreshCounts = useCallback(async () => {
    setCounts(await countUnsynced(db));
  }, [db]);

  const syncNow = useCallback(async () => {
    if (!client) {
      await refreshCounts();
      return;
    }
    if (running.current) {
      runAgain.current = true;
      return;
    }
    running.current = true;
    setState('syncing');
    try {
      let result: SyncResult;
      do {
        runAgain.current = false;
        result = await runSync(db, client);
      } while (runAgain.current && result.outcome === 'synced');

      // Show what the synchronization wrote into SQLite, without a loading spinner.
      await Promise.all([reloadCategories(), reloadBudgets(), reloadTransactions()]);
      await refreshCounts();
      if (result.outcome === 'synced') {
        setLastSyncedAt(new Date().toISOString());
        setState('synced');
      } else {
        setState(result.outcome);
      }
    } catch (error) {
      console.warn('Synchronization failed', error);
      setState('error');
    } finally {
      running.current = false;
    }
  }, [client, db, refreshCounts, reloadBudgets, reloadCategories, reloadTransactions]);

  // At startup.
  useEffect(() => {
    void syncNow();
  }, [syncNow]);

  // After every local change: update the counters at once, send a moment later.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = onLocalChange(() => {
      void refreshCounts();
      if (!client) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void syncNow(), DEBOUNCE_MS);
    });
    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, [client, refreshCounts, syncNow]);

  // When the app comes back to the foreground.
  useEffect(() => {
    if (!client) return;
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') void syncNow();
    });
    return () => subscription.remove();
  }, [client, syncNow]);

  const value = useMemo<SyncContextValue>(
    () => ({
      apiConfigured: client !== null,
      state,
      lastSyncedAt,
      pending: counts.pending,
      failed: counts.failed,
      syncNow,
    }),
    [client, state, lastSyncedAt, counts, syncNow],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}
