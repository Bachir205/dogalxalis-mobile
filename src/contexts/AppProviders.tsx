import type { ReactNode } from 'react';

import { BudgetsProvider } from './BudgetsContext';
import { PreferencesProvider } from './PreferencesContext';
import { ThemeProvider } from './ThemeContext';
import { TransactionsProvider } from './TransactionsContext';

/**
 * Every provider in one place. Order matters: later providers may use earlier ones
 * (Phase 4 inserts the database gate and CategoriesProvider before Transactions).
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <PreferencesProvider>
        <TransactionsProvider>
          <BudgetsProvider>{children}</BudgetsProvider>
        </TransactionsProvider>
      </PreferencesProvider>
    </ThemeProvider>
  );
}
