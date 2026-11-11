import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppGate } from '@/components/navigation/AppGate';
import { RootNavigator } from '@/components/navigation/RootNavigator';
import { AppProviders } from '@/contexts/AppProviders';

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
