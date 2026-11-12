import { useContext } from 'react';

import { DatabaseContext } from '@/contexts/DatabaseContext';
import type { Db } from '@/database/types';

import { requireContext } from './requireContext';

/** The open SQLite database (only available below <DatabaseProvider>). */
export function useDatabase(): Db {
  return requireContext(useContext(DatabaseContext), 'useDatabase', 'DatabaseProvider');
}
