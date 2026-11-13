import { useRouter } from 'expo-router';
import { PiggyBank, Plus } from 'lucide-react-native';
import { View } from 'react-native';

import { BudgetCard } from '@/components/budgets/BudgetCard';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import {
  AppButton,
  EmptyState,
  ErrorState,
  FloatingActionButton,
  LoadingState,
  MonthSwitcher,
  ScreenContainer,
} from '@/components/ui';
import { useBudgets } from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useCategories';
import { useI18n } from '@/hooks/useI18n';
import { usePreferences } from '@/hooks/usePreferences';
import { useTheme } from '@/hooks/useTheme';
import { formatMinor } from '@/utils/money';

/** Budgets tab: pick a month, see totals and one card per budget (spent, remaining, progress, status). */
export default function BudgetsScreen() {
  const { t, language } = useI18n();
  const { spacing } = useTheme();
  const router = useRouter();
  const { currency } = usePreferences();
  const { categoriesById } = useCategories();
  const { summaries, totals, selectedMonth, goToPreviousMonth, goToNextMonth, status, refresh } = useBudgets();

  if (status === 'loading' || status === 'idle') return <LoadingState />;
  if (status === 'error') return <ErrorState message={t('errors.loadFailed')} onRetry={refresh} />;

  const money = (minor: number) => formatMinor(minor, currency, language);
  const addBudget = () => router.push({ pathname: '/budgets/form', params: { month: selectedMonth } });

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer scroll edges={[]}>
        <MonthSwitcher month={selectedMonth} onPrevious={goToPreviousMonth} onNext={goToNextMonth} />

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <SummaryCard label={t('budgets.allocated')} value={money(totals.allocatedMinor)} />
          <SummaryCard label={t('budgets.spent')} value={money(totals.spentMinor)} tone="expense" />
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <SummaryCard
            label={t('budgets.remaining')}
            value={money(totals.remainingMinor)}
            tone={totals.remainingMinor < 0 ? 'expense' : 'income'}
          />
          <SummaryCard label={t('budgets.countLabel')} value={String(totals.count)} />
        </View>

        {summaries.length === 0 ? (
          <View style={{ gap: spacing.md }}>
            <EmptyState icon={PiggyBank} title={t('budgets.emptyTitle')} message={t('budgets.emptyMessage')} />
            <AppButton variant="secondary" label={t('budgets.add')} onPress={addBudget} />
          </View>
        ) : (
          summaries.map((summary) => (
            <BudgetCard
              key={summary.budget.id}
              summary={summary}
              category={categoriesById[summary.budget.categoryId]}
              onPress={() => router.push({ pathname: '/budgets/form', params: { id: summary.budget.id } })}
            />
          ))
        )}
        <View style={{ height: 72 }} />
      </ScreenContainer>
      <FloatingActionButton icon={Plus} label={t('budgets.add')} onPress={addBudget} />
    </View>
  );
}
