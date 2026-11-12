import { TriangleAlert } from 'lucide-react-native';
import { View } from 'react-native';

import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';

import { AppButton } from './AppButton';
import { AppText } from './AppText';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

/** Error message with an optional "Try again" button. */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { colors, spacing } = useTheme();
  const { t } = useI18n();
  return (
    <View
      accessibilityRole="alert"
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl, backgroundColor: colors.background }}>
      <TriangleAlert color={colors.error} size={48} strokeWidth={1.5} />
      <AppText tone="error" style={{ textAlign: 'center' }}>
        {message}
      </AppText>
      {onRetry ? <AppButton label={t('common.retry')} onPress={onRetry} /> : null}
    </View>
  );
}
