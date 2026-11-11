import { useContext } from 'react';

import { ThemeContext, type ThemeContextValue } from '@/contexts/ThemeContext';

import { requireContext } from './requireContext';

/** Current theme (colors and tokens) plus the user's mode choice and setMode(). */
export function useTheme(): ThemeContextValue {
  return requireContext(useContext(ThemeContext), 'useTheme', 'ThemeProvider');
}
