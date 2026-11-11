import { StyleSheet, Text, type TextProps } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { fontSize, fontWeight } from '@/theme/tokens';

type Variant = 'title' | 'subtitle' | 'body' | 'caption';
type Tone = 'default' | 'muted' | 'primary' | 'error';

interface AppTextProps extends TextProps {
  variant?: Variant;
  tone?: Tone;
}

export function AppText({ variant = 'body', tone = 'default', style, ...rest }: AppTextProps) {
  const { colors } = useTheme();
  const toneColor: Record<Tone, string> = {
    default: colors.text,
    muted: colors.textMuted,
    primary: colors.primary,
    error: colors.error,
  };
  return <Text style={[variantStyles[variant], { color: toneColor[tone] }, style]} {...rest} />;
}

const variantStyles = StyleSheet.create({
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold },
  subtitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold },
  body: { fontSize: fontSize.md, fontWeight: fontWeight.regular },
  caption: { fontSize: fontSize.sm, fontWeight: fontWeight.regular },
});
