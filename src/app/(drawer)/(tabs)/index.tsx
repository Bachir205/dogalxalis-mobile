import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { CategoryBadge } from '@/components/categories/CategoryBadge';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { TransactionCard } from '@/components/transactions/TransactionCard';
import {
  AppButton,
  AppCard,
  AppText,
  ErrorState,
  FloatingActionButton,
  LoadingState,
  ScreenContainer,
  SegmentedControl,
} from '@/components/ui';
import { useCategories } from '@/hooks/useCategories';
import { useI18n } from '@/hooks/useI18n';
import { usePreferences } from '@/hooks/usePreferences';
import { useTheme } from '@/hooks/useTheme';
import { useTransactions } from '@/hooks/useTransactions';
import { getCategoryName } from '@/utils/categories';
import { getCurrentMonth } from '@/utils/date';
import { formatMinor } from '@/utils/money';
import {
  computeCategorySpending,
  computeTotals,
  sortTransactions,
} from '@/utils/transactionCalculations';

type Period = 'month' | 'all';
const RECENT_COUNT = 5;
const SPENDING_ROWS = 5;

/** Home tab = Dashboard. Every number comes from the stored transactions. */
export default function HomeScreen() {
  const { t, language } = useI18n();
  const { colors, spacing, radius } = useTheme();
  const router = useRouter();
  const { currency } = usePreferences();
  const { transactions, status, refresh } = useTransactions();
  const { categoriesById } = useCategories();
  const [period, setPeriod] = useState<Period>('month');

  // useMemo: these are recomputed only when the transactions, currency or period change.
  const scope = useMemo(
    () => ({ currency, month: period === 'month' ? getCurrentMonth() : null }),
    [currency, period],
  );
  const totals = useMemo(() => computeTotals(transactions, scope), [transactions, scope]);
  const spending = useMemo(
    () => computeCategorySpending(transactions, scope).slice(0, SPENDING_ROWS),
    [transactions, scope],
  );
  const recent = useMemo(() => sortTransactions(transactions).slice(0, RECENT_COUNT), [transactions]);

  if (status === 'loading' || status === 'idle') return <LoadingState />;
  if (status === 'error') return <ErrorState message={t('errors.loadFailed')} onRetry={refresh} />;

  const money = (minor: number, sign = false) => formatMinor(minor, currency, language, { sign });
  const maxSpent = spending[0]?.totalMinor ?? 1;
  const periodOptions = [
    { value: 'month', label: t('home.periodMonth') },
    { value: 'all', label: t('home.periodAll') },
  ] as const;

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer scroll edges={[]}>
        <SegmentedControl<Period>
          accessibilityLabel={t('home.periodLabel')}
          options={periodOptions}
          value={period}
          onChange={setPeriod}
        />

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <SummaryCard label={t('home.income')} value={money(totals.income)} tone="income" />
          <SummaryCard label={t('home.expenses')} value={money(totals.expenses)} tone="expense" />
        </View>
        <SummaryCard label={t('home.net')} value={money(totals.net, true)} />
        <AppText variant="caption" tone="muted">
          {t('home.count', { count: totals.count })}
        </AppText>

        <AppCard>
          <AppText variant="subtitle">{t('home.spending')}</AppText>
          {spending.length === 0 ? (
            <AppText tone="muted">{t('home.noSpending')}</AppText>
          ) : (
            spending.map((row) => {
              const category = categoriesById[row.categoryId];
              return (
                <View key={row.categoryId} style={{ gap: spacing.xs }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <CategoryBadge icon={category?.icon ?? 'tag'} color={category?.color ?? null} size={28} />
                    <AppText style={{ flex: 1 }} numberOfLines={1}>
                      {getCategoryName(category, t)}
                    </AppText>
                    <AppText>{money(row.totalMinor)}</AppText>
                  </View>
                  <View style={{ height: 8, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted }}>
                    <View
                      style={{
                        height: 8,
                        borderRadius: radius.pill,
                        width: `${Math.max(2, Math.round((row.totalMinor / maxSpent) * 100))}%`,
                        backgroundColor: category?.color ?? colors.expense,
                      }}
                    />
                  </View>
                </View>
              );
            })
          )}
        </AppCard>

        <AppCard>
          <AppText variant="subtitle">{t('home.budgets')}</AppText>
          <AppText tone="muted">{t('home.budgetsSoon')}</AppText>
        </AppCard>

        <View style={{ gap: spacing.sm }}>
          <AppText variant="subtitle">{t('home.recent')}</AppText>
          {recent.length === 0 ? (
            <AppText tone="muted">{t('home.noRecent')}</AppText>
          ) : (
            <>
              {recent.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  category={categoriesById[transaction.categoryId]}
                  onPress={() =>
                    router.push({ pathname: '/transactions/[id]', params: { id: transaction.id } })
                  }
                />
              ))}
              <AppButton variant="secondary" label={t('common.seeAll')} onPress={() => router.navigate('/transactions')} />
            </>
          )}
        </View>
        {/* Space so the floating button never hides the last row. */}
        <View style={{ height: 72 }} />
      </ScreenContainer>
      <FloatingActionButton
        icon={Plus}
        label={t('common.addTransaction')}
        onPress={() => router.push('/transactions/new')}
      />
    </View>
  );
}
