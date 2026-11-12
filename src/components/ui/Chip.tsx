import type { LucideIcon } from 'lucide-react-native';
import { Pressable, Text } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: LucideIcon;
}

/** Small selectable pill (filters, category choices). Selected = filled. */
export function Chip({ label, selected, onPress, icon: Icon }: ChipProps) {
  const { colors, radius, spacing, fontSize, fontWeight, touchTarget } = useTheme();
  const foreground = selected ? colors.onPrimary : colors.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={{
        minHeight: touchTarget - 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primary : colors.surface,
      }}>
      {Icon ? <Icon color={foreground} size={16} /> : null}
      <Text style={{ color: foreground, fontSize: fontSize.sm, fontWeight: selected ? fontWeight.bold : fontWeight.regular }}>
        {label}
      </Text>
    </Pressable>
  );
}
