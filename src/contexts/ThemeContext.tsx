import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

import { STORAGE_KEYS } from '@/constants/storageKeys';
import { loadStored, saveStored } from '@/services/storage';
import { buildTheme, type ColorScheme, type Theme } from '@/theme';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeContextValue extends Theme {
  /** What the user chose (System follows the phone). */
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  /** False until the saved choice has been read from storage. */
  isReady: boolean;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

function parseMode(raw: unknown): ThemeMode | null {
  return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : null;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [isReady, setIsReady] = useState(false);

  // Effect 1: read the saved choice once, when the app starts.
  useEffect(() => {
    let cancelled = false;
    loadStored(STORAGE_KEYS.themeMode, parseMode).then((stored) => {
      if (cancelled) return;
      if (stored) setModeState(stored);
      setIsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Effect 2: save the choice whenever it changes (only after the first read finished).
  useEffect(() => {
    if (isReady) void saveStored(STORAGE_KEYS.themeMode, mode);
  }, [mode, isReady]);

  const setMode = useCallback((next: ThemeMode) => setModeState(next), []);

  const scheme: ColorScheme = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  // The value only changes when the resolved scheme or the mode changes.
  const value = useMemo<ThemeContextValue>(
    () => ({ ...buildTheme(scheme), mode, setMode, isReady }),
    [scheme, mode, setMode, isReady],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
