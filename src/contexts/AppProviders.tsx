import type { ReactNode } from 'react';

import type { Db } from '@/database/types';
import type { ApiClient } from '@/services/api';

import { BudgetsProvider } from './BudgetsContext';
import { CategoriesProvider } from './CategoriesContext';
import { DatabaseProvider } from './DatabaseContext';
import { PreferencesProvider } from './PreferencesContext';
import { SyncProvider } from './SyncContext';
import { ThemeProvider } from './ThemeContext';
import { TransactionsProvider } from './TransactionsContext';

interface AppProvidersProps {
  children: ReactNode;
  /** Replaceable in tests. */
  openDb?: () => Promise<Db>;
  /** Replaceable in tests. undefined = the server from EXPO_PUBLIC_API_URL, null = no server. */
  api?: ApiClient | null;
}

/**
 * Every provider in one place. Order matters: a provider can only use the ones above it.
 * Theme and Preferences come first (the loading screen needs them), then the database, then
 * the data providers that read from it, and the synchronization last (it reloads them all).
 */
export function AppProviders({ children, openDb, api }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <PreferencesProvider>
        <DatabaseProvider openDb={openDb}>
          <CategoriesProvider>
            <TransactionsProvider>
              <BudgetsProvider>
                <SyncProvider api={api}>{children}</SyncProvider>
              </BudgetsProvider>
            </TransactionsProvider>
          </CategoriesProvider>
        </DatabaseProvider>
      </PreferencesProvider>
    </ThemeProvider>
  );
}
