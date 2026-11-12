import type { ReactNode } from 'react';

import type { Db } from '@/database/types';

import { BudgetsProvider } from './BudgetsContext';
import { CategoriesProvider } from './CategoriesContext';
import { DatabaseProvider } from './DatabaseContext';
import { PreferencesProvider } from './PreferencesContext';
import { ThemeProvider } from './ThemeContext';
import { TransactionsProvider } from './TransactionsContext';

/**
 * Every provider in one place. Order matters: a provider can only use the ones above it.
 * Theme and Preferences come first (the loading screen needs them), then the database,
 * then the data providers that read from it.
 */
export function AppProviders({ children, openDb }: { children: ReactNode; openDb?: () => Promise<Db> }) {
  return (
    <ThemeProvider>
      <PreferencesProvider>
        <DatabaseProvider openDb={openDb}>
          <CategoriesProvider>
            <TransactionsProvider>
              <BudgetsProvider>{children}</BudgetsProvider>
            </TransactionsProvider>
          </CategoriesProvider>
        </DatabaseProvider>
      </PreferencesProvider>
    </ThemeProvider>
  );
}
