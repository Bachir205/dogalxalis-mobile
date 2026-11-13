import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { CategoryBadge } from '@/components/categories/CategoryBadge';
import { AppButton, AppCard, AppText } from '@/components/ui';
import { useBudgetOverview } from '@/hooks/useBudgetOverview';
import { useCategories } from '@/hooks/useCategories';
import { useI18n } from '@/hooks/useI18n';
import { usePreferences } from '@/hooks/usePreferences';
import { useTheme } from '@/hooks/useTheme';
import { getBudgetStatus } from '@/utils/budgetCalculations';
import { getCategoryName } from '@/utils/categories';
import { formatMinor } from '@/utils/money';

import { BudgetProgressBar } from './BudgetProgressBar';
import { BudgetStatusBadge } from './BudgetStatusBadge';

const MAX_ROWS = 3;

/** Dashboard card: total spent against total allocated this month, and the most consumed budgets. */
export function BudgetOverviewCard({ month }: { month: string }) {
  const { t, language } = useI18n();
  const { spacing } = useTheme();
  const router = useRouter();
  const { currency } = usePreferences();
  const { categoriesById } = useCategories();
  const { summaries, totals } = useBudgetOverview(month);

  const money = (minor: number) => formatMinor(minor, currency, language);
  const totalPercent =
    totals.allocatedMinor > 0 ? Math.floor((totals.spentMinor * 100) / totals.allocatedMinor) : 0;

  return (
    <AppCard style={{ gap: spacing.md }}>
      <AppText variant="subtitle">{t('home.budgets')}</AppText>
      {summaries.length === 0 ? (
        <AppText tone="muted">{t('home.noBudgets')}</AppText>
      ) : (
        <>
          <AppText>{t('home.budgetsSpent', { spent: money(totals.spentMinor), allocated: money(totals.allocatedMinor) })}</AppText>
          <BudgetProgressBar
            progressPercent={totalPercent}
            status={getBudgetStatus(totals.spentMinor, totals.allocatedMinor)}
            label={t('home.budgets')}
          />
          <AppText variant="caption" tone="muted">
            {`${t('budgets.remaining')}: ${money(totals.remainingMinor)}`}
          </AppText>
          {summaries.slice(0, MAX_ROWS).map((summary) => {
            const category = categoriesById[summary.budget.categoryId];
            return (
              <View key={summary.budget.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <CategoryBadge icon={category?.icon ?? 'tag'} color={category?.color ?? null} size={28} />
                <AppText style={{ flex: 1 }} numberOfLines={1}>
                  {getCategoryName(category, t)}
                </AppText>
                <BudgetStatusBadge status={summary.status} />
                <AppText style={{ minWidth: 44, textAlign: 'right' }}>{`${summary.progressPercent}%`}</AppText>
              </View>
            );
          })}
          <AppButton variant="secondary" label={t('common.seeAll')} onPress={() => router.navigate('/budgets')} />
        </>
      )}
    </AppCard>
  );
}
