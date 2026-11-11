import Constants from 'expo-constants';
import { usePathname, useRouter } from 'expo-router';
import {
  DrawerContentScrollView,
  DrawerItem,
  type DrawerContentComponentProps,
} from 'expo-router/drawer';
import { Info, LayoutDashboard, Tags, Wallet } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText } from '@/components/ui';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';

type DrawerHref = '/' | '/categories' | '/about';

/**
 * Custom drawer menu. "Dashboard" points at the Home tab ('/'), so there is no duplicate
 * screen: the drawer is just another way to reach an existing destination.
 */
export function AppDrawerContent(props: DrawerContentComponentProps) {
  const { colors, spacing, radius } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  const go = (href: DrawerHref) => {
    router.navigate(href);
    props.navigation.closeDrawer();
  };

  const items = [
    { href: '/', label: t('nav.dashboard'), Icon: LayoutDashboard },
    { href: '/categories', label: t('nav.categories'), Icon: Tags },
    { href: '/about', label: t('nav.about'), Icon: Info },
  ] as const;

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: spacing.xl }}>
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.lg,
          gap: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          marginBottom: spacing.md,
        }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: radius.lg,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Wallet color={colors.onPrimary} size={28} />
        </View>
        <AppText variant="title">{t('app.name')}</AppText>
        <AppText tone="muted">{t('drawer.tagline')}</AppText>
      </View>

      {items.map(({ href, label, Icon }) => (
        <DrawerItem
          key={href}
          label={label}
          focused={pathname === href}
          onPress={() => go(href)}
          icon={({ color, size }) => <Icon color={color} size={size} />}
          activeTintColor={colors.primary}
          inactiveTintColor={colors.text}
          activeBackgroundColor={colors.surfaceMuted}
        />
      ))}

      <View style={{ padding: spacing.lg }}>
        <AppText variant="caption" tone="muted">
          {t('drawer.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}
        </AppText>
      </View>
    </DrawerContentScrollView>
  );
}
