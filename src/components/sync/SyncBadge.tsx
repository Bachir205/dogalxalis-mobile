import { Clock, TriangleAlert } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText } from '@/components/ui';
import { useI18n } from '@/hooks/useI18n';
import { useSync } from '@/hooks/useSync';
import { useTheme } from '@/hooks/useTheme';
import type { SyncStatus } from '@/types';

/**
 * "Pending" (waiting to be sent) or "Rejected" (refused by the server). Shown only when a server
 * is configured and the record is not in sync; icon + text, so color is never the only signal.
 */
export function SyncBadge({ status }: { status: SyncStatus }) {
  const { apiConfigured } = useSync();
  const { colors, spacing } = useTheme();
  const { t } = useI18n();
  if (!apiConfigured || status === 'synced') return null;

  const failed = status === 'failed';
  const color = failed ? colors.error : colors.textMuted;
  const Icon = failed ? TriangleAlert : Clock;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
      <Icon color={color} size={12} />
      <AppText variant="caption" style={{ color, fontSize: 12 }}>
        {failed ? t('sync.badgeFailed') : t('sync.badgePending')}
      </AppText>
    </View>
  );
}
