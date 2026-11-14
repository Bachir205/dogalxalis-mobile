import { useLocalSearchParams, useRouter } from 'expo-router';
import { ReceiptText } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { CategoryBadge } from '@/components/categories/CategoryBadge';
import { SyncBadge } from '@/components/sync/SyncBadge';
import {
  AppButton,
  AppCard,
  AppText,
  confirmAction,
  EmptyState,
  ScreenContainer,
} from '@/components/ui';
import { useCategories } from '@/hooks/useCategories';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';
import { useTransactions } from '@/hooks/useTransactions';
import { getCategoryName } from '@/utils/categories';
import { formatDisplayDate } from '@/utils/dateFormat';
import { formatMinor } from '@/utils/money';

/** Transaction details with Edit and Delete. */
export default function TransactionDetailScreen() {
  const { t, language } = useI18n();
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { transactions, removeTransaction } = useTransactions();
  const { categoriesById } = useCategories();
  const [error, setError] = useState<string | null>(null);

  const transaction = transactions.find((item) => item.id === id);
  if (!transaction) {
    return (
      <ScreenContainer>
        <EmptyState icon={ReceiptText} title={t('transactions.notFoundTitle')} message={t('errors.notFound')} />
      </ScreenContainer>
    );
  }

  const category = categoriesById[transaction.categoryId];
  const isIncome = transaction.type === 'income';
  const amount = formatMinor(
    isIncome ? transaction.amountMinor : -transaction.amountMinor,
    transaction.currency,
    language,
    { sign: true },
  );

  const askDelete = () =>
    confirmAction({
      title: t('transactions.deleteTitle'),
      message: t('transactions.deleteMessage', { title: transaction.title }),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      onConfirm: async () => {
        try {
          await removeTransaction(transaction.id);
          router.back();
        } catch (failure) {
          console.warn('Could not delete the transaction', failure);
          setError(t('errors.saveFailed'));
        }
      },
    });

  const row = (label: string, value: string) => (
    <View style={{ gap: 2 }}>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      <AppText>{value}</AppText>
    </View>
  );

  return (
    <ScreenContainer scroll>
      <AppCard>
        <AppText variant="title" style={{ color: isIncome ? colors.income : colors.expense }}>
          {amount}
        </AppText>
        <AppText variant="subtitle">{transaction.title}</AppText>
        <SyncBadge status={transaction.syncStatus} />
      </AppCard>

      <AppCard style={{ gap: spacing.md }}>
        {row(t('transactions.type'), isIncome ? t('types.income') : t('types.expense'))}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <CategoryBadge icon={category?.icon ?? 'tag'} color={category?.color ?? null} size={32} />
          {row(t('transactions.category'), getCategoryName(category, t))}
        </View>
        {row(t('transactions.date'), formatDisplayDate(transaction.date, language))}
        {row(t('transactions.description'), transaction.description ?? t('transactions.noDescription'))}
      </AppCard>

      {error ? (
        <AppText tone="error" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}

      <AppButton
        variant="secondary"
        label={t('common.edit')}
        onPress={() => router.push({ pathname: '/transactions/edit/[id]', params: { id: transaction.id } })}
      />
      <AppButton variant="danger" label={t('common.delete')} onPress={askDelete} />
    </ScreenContainer>
  );
}
