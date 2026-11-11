import type { ReactNode } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';

interface ScreenContainerProps {
  children: ReactNode;
  /** Wrap content in a ScrollView (for long screens). */
  scroll?: boolean;
  /**
   * Which screen edges need safe-area padding. Navigators already pad the top (header)
   * and the bottom (tab bar), so tab screens pass [] while other screens keep ['bottom'].
   */
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
}

export function ScreenContainer({
  children,
  scroll = false,
  edges = ['bottom'],
  style,
}: ScreenContainerProps) {
  const { colors, spacing } = useTheme();
  const padding = { padding: spacing.lg, gap: spacing.lg };

  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: colors.background }}>
      {scroll ? (
        <ScrollView contentContainerStyle={padding} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, padding, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}
