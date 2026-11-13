import { View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import type { BudgetStatus } from '@/utils/budgetCalculations';

import { useBudgetStatusStyle } from './BudgetStatusBadge';

interface BudgetProgressBarProps {
  /** Real percentage (can exceed 100). The bar itself stops at 100%. */
  progressPercent: number;
  status: BudgetStatus;
  /** Spoken by screen readers, e.g. "Food budget". */
  label: string;
}

export function BudgetProgressBar({ progressPercent, status, label }: BudgetProgressBarProps) {
  const { colors, radius } = useTheme();
  const { color } = useBudgetStatusStyle(status);
  const filled = Math.max(0, Math.min(100, progressPercent));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: filled, text: `${progressPercent}%` }}
      style={{ height: 10, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, overflow: 'hidden' }}>
      <View style={{ height: '100%', width: `${filled}%`, backgroundColor: color }} />
    </View>
  );
}
