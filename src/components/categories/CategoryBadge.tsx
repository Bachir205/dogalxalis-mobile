import { View } from 'react-native';

import { getCategoryIcon } from '@/constants/categoryIcons';
import { useTheme } from '@/hooks/useTheme';

interface CategoryBadgeProps {
  icon: string;
  color: string | null;
  size?: number;
}

/** Round icon on a soft tint of the category color. */
export function CategoryBadge({ icon, color, size = 40 }: CategoryBadgeProps) {
  const { colors } = useTheme();
  const Icon = getCategoryIcon(icon);
  const tint = color ?? colors.textMuted;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: `${tint}26`,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Icon color={tint} size={size * 0.5} />
    </View>
  );
}
