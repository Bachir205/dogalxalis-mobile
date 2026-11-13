import { Pressable, View } from 'react-native';

import { CategoryBadge } from '@/components/categories/CategoryBadge';
import { AppText } from '@/components/ui';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';
import type { Category } from '@/types';
import type { BudgetSummary } from '@/utils/budgetCalculations';
import { getCategoryName } from '@/utils/categories';
import { formatMinor } from '@/utils/money';

import { BudgetProgressBar } from './BudgetProgressBar';
import { BudgetStatusBadge, useBudgetStatusStyle } from './BudgetStatusBadge';

interface BudgetCardProps {
  summary: BudgetSummary;
  category: Category | undefined;
  onPress?: () => void;
}

/** Category, status, "spent of limit", progress bar with real percentage, remaining or exceeded amount. */
export function BudgetCard({ summary, category, onPress }: BudgetCardProps) {
  const { colors, spacing, radius } = useTheme();
  const { t, language } = useI18n();
  const { label: statusLabel } = useBudgetStatusStyle(summary.status);

  const { budget, spentMinor, remainingMinor, exceededMinor, progressPercent, status } = summary;
  const money = (minor: number) => formatMinor(minor, budget.currency, language);
  const name = getCategoryName(category, t);
  const spentText = t('budgets.spentOfLimit', { spent: money(spentMinor), limit: money(budget.amountMinor) });
  const remainingText =
    status === 'exceeded'
      ? t('budgets.exceededBy', { amount: money(exceededMinor) })
      : t('budgets.remainingAmount', { amount: money(remainingMinor) });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${statusLabel}, ${spentText}, ${progressPercent}%, ${remainingText}`}
      style={({ pressed }) => ({
        gap: spacing.sm,
        padding: spacing.lg,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
      })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <CategoryBadge icon={category?.icon ?? 'tag'} color={category?.color ?? null} />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="subtitle" numberOfLines={1}>
            {name}
          </AppText>
          <BudgetStatusBadge status={status} />
        </View>
        <AppText variant="subtitle">{`${progressPercent}%`}</AppText>
      </View>

      <BudgetProgressBar progressPercent={progressPercent} status={status} label={`${name}: ${progressPercent}%`} />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}>
        <AppText variant="caption" tone="muted" style={{ flexShrink: 1 }}>
          {spentText}
        </AppText>
        <AppText variant="caption" tone={status === 'exceeded' ? 'error' : 'muted'} style={{ flexShrink: 1, textAlign: 'right' }}>
          {remainingText}
        </AppText>
      </View>
    </Pressable>
  );
}
