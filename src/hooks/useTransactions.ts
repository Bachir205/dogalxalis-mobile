import { useContext } from 'react';

import {
  TransactionsContext,
  type TransactionsContextValue,
} from '@/contexts/TransactionsContext';

import { requireContext } from './requireContext';

/** Transaction list, load status and the add / update / remove actions. */
export function useTransactions(): TransactionsContextValue {
  return requireContext(useContext(TransactionsContext), 'useTransactions', 'TransactionsProvider');
}
