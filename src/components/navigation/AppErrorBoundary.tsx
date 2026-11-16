import { Pressable, Text, View, useColorScheme } from 'react-native';

import { translate } from '@/i18n';
import { detectDeviceLanguage } from '@/i18n/device';
import { buildTheme } from '@/theme';

interface AppErrorBoundaryProps {
  error: Error;
  retry: () => void | Promise<void>;
}

/**
 * Last-resort screen if something crashes while drawing. It works on its own (no providers,
 * no contexts), because the crash may have happened inside one of them.
 */
export function AppErrorBoundary({ error, retry }: AppErrorBoundaryProps) {
  const theme = buildTheme(useColorScheme() === 'dark' ? 'dark' : 'light');
  const { colors, spacing, radius, fontSize, fontWeight, touchTarget } = theme;
  const language = detectDeviceLanguage();

  return (
    <View
      accessibilityRole="alert"
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl, backgroundColor: colors.background }}>
      <Text style={{ color: colors.text, fontSize: fontSize.xl, fontWeight: fontWeight.bold, textAlign: 'center' }}>
        {translate(language, 'errors.unexpected')}
      </Text>
      <Text style={{ color: colors.textMuted, fontSize: fontSize.md, textAlign: 'center' }}>
        {translate(language, 'errors.unexpectedHint')}
      </Text>
      <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, textAlign: 'center' }}>{error.message}</Text>
      <Pressable
        onPress={() => void retry()}
        accessibilityRole="button"
        accessibilityLabel={translate(language, 'common.retry')}
        style={{ minHeight: touchTarget, justifyContent: 'center', paddingHorizontal: spacing.xl, borderRadius: radius.md, backgroundColor: colors.primary }}>
        <Text style={{ color: colors.onPrimary, fontSize: fontSize.md, fontWeight: fontWeight.semibold }}>
          {translate(language, 'common.retry')}
        </Text>
      </Pressable>
    </View>
  );
}
