import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';

/**
 * Root navigator: a Stack. The Drawer (with the tabs inside) is its first screen; forms and
 * detail screens are pushed on top of it, so they never appear as drawer items and the
 * Android Back button returns to where the user came from.
 */
export default function RootLayout() {
  const { scheme, colors } = useTheme();
  const { t } = useI18n();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { color: colors.text },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
        <Stack.Screen
          name="transactions/new"
          options={{ title: t('nav.newTransaction'), presentation: 'modal' }}
        />
        <Stack.Screen name="transactions/[id]" options={{ title: t('nav.transactionDetails') }} />
        <Stack.Screen
          name="transactions/edit/[id]"
          options={{ title: t('nav.editTransaction'), presentation: 'modal' }}
        />
        <Stack.Screen name="budgets/form" options={{ presentation: 'modal' }} />
        <Stack.Screen name="categories/form" options={{ presentation: 'modal' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
