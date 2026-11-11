import { useContext } from 'react';

import { PreferencesContext, type PreferencesContextValue } from '@/contexts/PreferencesContext';

import { requireContext } from './requireContext';

/** Language and currency preferences, with their setters. */
export function usePreferences(): PreferencesContextValue {
  return requireContext(useContext(PreferencesContext), 'usePreferences', 'PreferencesProvider');
}
