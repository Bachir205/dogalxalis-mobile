import { useContext } from 'react';

import { SyncContext, type SyncContextValue } from '@/contexts/SyncContext';

import { requireContext } from './requireContext';

/** Synchronization status (configured? syncing? offline?), counters and syncNow(). */
export function useSync(): SyncContextValue {
  return requireContext(useContext(SyncContext), 'useSync', 'SyncProvider');
}
