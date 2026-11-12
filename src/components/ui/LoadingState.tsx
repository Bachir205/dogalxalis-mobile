import { ActivityIndicator, View } from 'react-native';

import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';

import { AppText } from './AppText';

/** Centered spinner with a short message. */
export function LoadingState({ message }: { message?: string }) {
  const { colors, spacing } = useTheme();
  const { t } = useI18n();
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={message ?? t('common.loading')}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
      <AppText tone="muted">{message ?? t('common.loading')}</AppText>
    </View>
  );
}
