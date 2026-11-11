import * as SplashScreen from 'expo-splash-screen';
import { useEffect, type ReactNode } from 'react';

import { usePreferences } from '@/hooks/usePreferences';
import { useTheme } from '@/hooks/useTheme';

// Keep the splash screen visible until the saved theme and language are loaded,
// so the app never flashes the wrong theme or language at startup.
SplashScreen.preventAutoHideAsync().catch(() => {});

export function AppGate({ children }: { children: ReactNode }) {
  const { isReady: themeReady } = useTheme();
  const { isReady: preferencesReady } = usePreferences();
  const ready = themeReady && preferencesReady;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  return ready ? <>{children}</> : null;
}
