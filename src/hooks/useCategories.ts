import { useContext } from 'react';

import { CategoriesContext, type CategoriesContextValue } from '@/contexts/CategoriesContext';

import { requireContext } from './requireContext';

/** Categories, a lookup by id, and the add / update actions. */
export function useCategories(): CategoriesContextValue {
  return requireContext(useContext(CategoriesContext), 'useCategories', 'CategoriesProvider');
}
