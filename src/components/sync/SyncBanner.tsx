import { CloudOff, TriangleAlert, Clock } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { AppText } from '@/components/ui';
import { useI18n } from '@/hooks/useI18n';
import { useSync } from '@/hooks/useSync';
import { useTheme } from '@/hooks/useTheme';

/**
 * A one-line notice at the top of the main screens when something is waiting to be sent, the
 * server cannot be reached or it refused something. Tap it to synchronize now.
 * It shows nothing when everything is in sync or when no server is configured.
 */
export function SyncBanner() {
  const { apiConfigured, state, pending, failed, syncNow } = useSync();
  const { colors, spacing, radius, touchTarget } = useTheme();
  const { t } = useI18n();
  if (!apiConfigured) return null;

  let message: string | null = null;
  let Icon = Clock;
  let color = colors.textMuted;
  if (state === 'offline') {
    message = t('sync.bannerOffline', { count: pending });
    Icon = CloudOff;
  } else if (state === 'error') {
    message = t('sync.bannerError', { count: pending });
    Icon = TriangleAlert;
    color = colors.error;
  } else if (failed > 0) {
    message = t('sync.failed', { count: failed });
    Icon = TriangleAlert;
    color = colors.error;
  } else if (pending > 0 && state !== 'syncing') {
    message = t('sync.pending', { count: pending });
  }
  if (message === null) return null;

  return (
    <Pressable
      onPress={() => void syncNow()}
      accessibilityRole="button"
      accessibilityLabel={message}
      accessibilityHint={t('sync.bannerHint')}
      style={({ pressed }) => ({
        minHeight: touchTarget,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: color,
        backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
      })}>
      <Icon color={color} size={18} />
      <AppText variant="caption" style={{ flex: 1, color }}>
        {message}
      </AppText>
    </Pressable>
  );
}
