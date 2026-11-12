import { useRouter } from 'expo-router';
import { ArrowLeftRight, Plus, ReceiptText } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, View } from 'react-native';

import { TransactionCard } from '@/components/transactions/TransactionCard';
import {
  AppButton,
  AppInput,
  Chip,
  EmptyState,
  ErrorState,
  FloatingActionButton,
  LoadingState,
  MonthSwitcher,
  SegmentedControl,
} from '@/components/ui';
import { getCategoryIcon } from '@/constants/categoryIcons';
import { useCategories } from '@/hooks/useCategories';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';
import { useTransactions } from '@/hooks/useTransactions';
import { getCategoryName } from '@/utils/categories';
import { getCurrentMonth, shiftMonth } from '@/utils/date';
import { sortTransactions } from '@/utils/transactionCalculations';
import {
  DEFAULT_FILTERS,
  filterTransactions,
  hasActiveFilters,
  type TransactionFilters,
} from '@/utils/transactionFilters';

type DateMode = 'all' | 'month';

/** Transactions tab: search, filter by type / category / month, newest first. */
export default function TransactionsScreen() {
  const { t } = useI18n();
  const { spacing } = useTheme();
  const router = useRouter();
  const { transactions, status, refresh } = useTransactions();
  const { categories, categoriesById } = useCategories();
  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_FILTERS);

  // useMemo: filtering and sorting run again only when the data or the filters change.
  const visible = useMemo(
    () => sortTransactions(filterTransactions(transactions, filters)),
    [transactions, filters],
  );

  if (status === 'loading' || status === 'idle') return <LoadingState />;
  if (status === 'error') return <ErrorState message={t('errors.loadFailed')} onRetry={refresh} />;

  const update = (changes: Partial<TransactionFilters>) =>
    setFilters((current) => ({ ...current, ...changes }));

  const typeOptions = [
    { value: 'all', label: t('common.all') },
    { value: 'income', label: t('types.income') },
    { value: 'expense', label: t('types.expense') },
  ] as const;
  const dateOptions = [
    { value: 'all', label: t('transactions.allDates') },
    { value: 'month', label: t('transactions.byMonth') },
  ] as const;
  const dateMode: DateMode = filters.month === null ? 'all' : 'month';

  const header = (
    <View style={{ gap: spacing.md, paddingBottom: spacing.md }}>
      <AppInput
        label={t('transactions.searchLabel')}
        placeholder={t('transactions.searchPlaceholder')}
        value={filters.search}
        onChangeText={(search) => update({ search })}
        returnKeyType="search"
      />
      <SegmentedControl
        accessibilityLabel={t('transactions.typeLabel')}
        options={typeOptions}
        value={filters.type}
        onChange={(type) => update({ type })}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
        <Chip
          label={t('transactions.allCategories')}
          selected={filters.categoryId === null}
          onPress={() => update({ categoryId: null })}
        />
        {categories.map((category) => (
          <Chip
            key={category.id}
            label={getCategoryName(category, t)}
            icon={getCategoryIcon(category.icon)}
            selected={filters.categoryId === category.id}
            onPress={() => update({ categoryId: category.id })}
          />
        ))}
      </ScrollView>
      <SegmentedControl<DateMode>
        accessibilityLabel={t('transactions.dateLabel')}
        options={dateOptions}
        value={dateMode}
        onChange={(mode) => update({ month: mode === 'all' ? null : getCurrentMonth() })}
      />
      {filters.month !== null ? (
        <MonthSwitcher
          month={filters.month}
          onPrevious={() => update({ month: shiftMonth(filters.month as string, -1) })}
          onNext={() => update({ month: shiftMonth(filters.month as string, 1) })}
        />
      ) : null}
    </View>
  );

  const empty =
    transactions.length === 0 ? (
      <EmptyState
        icon={ArrowLeftRight}
        title={t('transactions.emptyTitle')}
        message={t('transactions.emptyMessage')}
      />
    ) : (
      <View style={{ gap: spacing.md }}>
        <EmptyState
          icon={ReceiptText}
          title={t('transactions.noResultsTitle')}
          message={t('transactions.noResultsMessage')}
        />
        {hasActiveFilters(filters) ? (
          <AppButton
            variant="secondary"
            label={t('transactions.clearFilters')}
            onPress={() => setFilters(DEFAULT_FILTERS)}
          />
        ) : null}
      </View>
    );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 96 }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        renderItem={({ item }) => (
          <TransactionCard
            transaction={item}
            category={categoriesById[item.categoryId]}
            onPress={() => router.push({ pathname: '/transactions/[id]', params: { id: item.id } })}
          />
        )}
      />
      <FloatingActionButton
        icon={Plus}
        label={t('common.addTransaction')}
        onPress={() => router.push('/transactions/new')}
      />
    </View>
  );
}
