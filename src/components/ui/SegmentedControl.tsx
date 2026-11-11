import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Names the group for screen readers, e.g. "Theme". */
  accessibilityLabel: string;
}

/** A row of mutually exclusive choices (radio buttons). The selected one is filled. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  const { colors, radius, fontSize, fontWeight, touchTarget } = useTheme();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={{
        flexDirection: 'row',
        backgroundColor: colors.surfaceMuted,
        borderRadius: radius.md,
        padding: 4,
        gap: 4,
      }}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked: selected, selected }}
            style={{
              flex: 1,
              minHeight: touchTarget,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radius.sm,
              paddingHorizontal: 4,
              backgroundColor: selected ? colors.primary : 'transparent',
            }}>
            <Text
              numberOfLines={1}
              style={{
                fontSize: fontSize.sm,
                fontWeight: selected ? fontWeight.bold : fontWeight.regular,
                color: selected ? colors.onPrimary : colors.text,
              }}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
