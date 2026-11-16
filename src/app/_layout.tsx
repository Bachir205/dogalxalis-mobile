import type { ErrorBoundaryProps } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppErrorBoundary } from '@/components/navigation/AppErrorBoundary';
import { AppGate } from '@/components/navigation/AppGate';
import { RootNavigator } from '@/components/navigation/RootNavigator';
import { AppProviders } from '@/contexts/AppProviders';

/** Shown by Expo Router if a screen crashes while drawing, instead of a red error screen. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return <AppErrorBoundary error={error} retry={retry} />;
}

/** Entry layout: gesture root, then all providers, then the gate, then the navigators. */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProviders>
        <AppGate>
          <RootNavigator />
        </AppGate>
      </AppProviders>
    </GestureHandlerRootView>
  );
}
