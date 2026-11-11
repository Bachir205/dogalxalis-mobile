import type { LucideIcon } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

interface FloatingActionButtonProps {
  icon: LucideIcon;
  /** Spoken by screen readers (the button has no visible text). */
  label: string;
  onPress: () => void;
}

/** Round button pinned to the bottom-right corner of its screen. */
export function FloatingActionButton({ icon: Icon, label, onPress }: FloatingActionButtonProps) {
  const { colors, spacing } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        position: 'absolute',
        right: spacing.lg,
        bottom: spacing.lg,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        opacity: pressed ? 0.85 : 1,
      })}>
      <Icon color={colors.onPrimary} size={26} />
    </Pressable>
  );
}
