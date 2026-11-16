import { View } from 'react-native';

import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';

import { AppText } from './AppText';

/** Small "Demo" tag on records that come from the sample data. Text, not only color. */
export function DemoBadge({ isDemo }: { isDemo?: boolean }) {
  const { colors, radius, spacing } = useTheme();
  const { t } = useI18n();
  if (!isDemo) return null;
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.sm,
        paddingVertical: 1,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.secondary,
      }}>
      <AppText variant="caption" style={{ color: colors.secondary, fontSize: 11, fontWeight: '700' }}>
        {t('demo.badge')}
      </AppText>
    </View>
  );
}
