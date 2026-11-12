import { createContext, useEffect, useState, type ReactNode } from 'react';

import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { getDatabase } from '@/database/database';
import type { Db } from '@/database/types';
import { useI18n } from '@/hooks/useI18n';

export const DatabaseContext = createContext<Db | null>(null);

type DatabaseState =
  | { status: 'loading' }
  | { status: 'ready'; db: Db }
  | { status: 'error' };

interface DatabaseProviderProps {
  children: ReactNode;
  /** Replaceable in tests. */
  openDb?: () => Promise<Db>;
}

/**
 * Opens SQLite (running migrations) before anything that needs data is rendered.
 * While it opens: a spinner. If it fails: an error with a "Try again" button.
 */
export function DatabaseProvider({ children, openDb = getDatabase }: DatabaseProviderProps) {
  const { t } = useI18n();
  const [state, setState] = useState<DatabaseState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    openDb()
      .then((db) => {
        if (!cancelled) setState({ status: 'ready', db });
      })
      .catch((error) => {
        console.warn('Could not open the database', error);
        if (!cancelled) setState({ status: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [openDb, attempt]);

  if (state.status === 'loading') return <LoadingState />;
  if (state.status === 'error') {
    return <ErrorState message={t('errors.loadFailed')} onRetry={() => setAttempt((n) => n + 1)} />;
  }
  return <DatabaseContext.Provider value={state.db}>{children}</DatabaseContext.Provider>;
}
