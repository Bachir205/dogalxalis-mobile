import { TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { AppText } from './AppText';

interface AppInputProps extends Omit<TextInputProps, 'style' | 'accessibilityLabel'> {
  label: string;
  /** Already translated message. Shown under the field, so color is never the only signal. */
  error?: string;
}

export function AppInput({ label, error, multiline, ...rest }: AppInputProps) {
  const { colors, radius, spacing, fontSize, touchTarget } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        style={{
          minHeight: multiline ? touchTarget * 2 : touchTarget,
          borderWidth: 1,
          borderColor: error ? colors.error : colors.border,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          backgroundColor: colors.surface,
          color: colors.text,
          fontSize: fontSize.md,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
        {...rest}
      />
      {error ? (
        <AppText variant="caption" tone="error" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
