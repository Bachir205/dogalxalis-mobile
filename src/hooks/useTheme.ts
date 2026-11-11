import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { buildTheme, type Theme } from '@/theme';

/**
 * Phase 1: follows the system color scheme only.
 * Phase 3 replaces this body with a read from ThemeContext (Light / Dark / System
 * + persistence). The return type stays the same, so no component changes.
 */
export function useTheme(): Theme {
  const systemScheme = useColorScheme();
  return useMemo(() => buildTheme(systemScheme === 'dark' ? 'dark' : 'light'), [systemScheme]);
}
