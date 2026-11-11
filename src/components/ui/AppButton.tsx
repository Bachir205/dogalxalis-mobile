import { ActivityIndicator, Pressable, Text } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

type Variant = 'primary' | 'secondary' | 'danger';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
}

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  accessibilityHint,
}: AppButtonProps) {
  const { colors, radius, spacing, fontSize, fontWeight, touchTarget } = useTheme();
  const inactive = disabled || loading;

  const palette: Record<Variant, { background: string; foreground: string; border: string }> = {
    primary: { background: colors.primary, foreground: colors.onPrimary, border: colors.primary },
    secondary: { background: 'transparent', foreground: colors.primary, border: colors.primary },
    danger: { background: colors.error, foreground: colors.onPrimary, border: colors.error },
  };
  const { background, foreground, border } = palette[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => ({
        minHeight: touchTarget,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: border,
        backgroundColor: background,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: spacing.sm,
        opacity: inactive ? 0.5 : pressed ? 0.85 : 1,
      })}>
      {loading ? <ActivityIndicator color={foreground} /> : null}
      <Text style={{ color: foreground, fontSize: fontSize.md, fontWeight: fontWeight.semibold }}>
        {label}
      </Text>
    </Pressable>
  );
}
