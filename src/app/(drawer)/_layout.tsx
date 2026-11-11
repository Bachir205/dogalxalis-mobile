import { Drawer, DrawerToggleButton } from 'expo-router/drawer';

import { AppDrawerContent } from '@/components/navigation/AppDrawerContent';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';

/** Drawer: wraps the tabs (as one entry) and the secondary pages (Categories, About). */
export default function DrawerLayout() {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <Drawer
      drawerContent={(props) => <AppDrawerContent {...props} />}
      screenOptions={{
        // Our own button, so its accessibility label is translated (the default one is English).
        headerLeft: () => (
          <DrawerToggleButton tintColor={colors.text} accessibilityLabel={t('nav.openMenu')} />
        ),
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },
        headerShadowVisible: false,
        drawerStyle: { backgroundColor: colors.surface },
        sceneStyle: { backgroundColor: colors.background },
      }}>
      {/* The tabs bring their own header, so the drawer hides its own for this entry. */}
      <Drawer.Screen name="(tabs)" options={{ headerShown: false, title: t('nav.dashboard') }} />
      <Drawer.Screen name="categories" options={{ title: t('nav.categories') }} />
      <Drawer.Screen name="about" options={{ title: t('nav.about') }} />
    </Drawer>
  );
}
