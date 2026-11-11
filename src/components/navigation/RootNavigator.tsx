import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';

/**
 * Root Stack. The Drawer (with the tabs inside) is its first screen; forms and detail screens
 * are pushed above it, so they never appear as drawer items and Android Back works.
 */
export function RootNavigator() {
  const { scheme, colors } = useTheme();
  const { t } = useI18n();

  return (
    <>
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
    </>
  );
}
