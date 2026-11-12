import { Pressable, View } from 'react-native';

import { CategoryBadge } from '@/components/categories/CategoryBadge';
import { AppText } from '@/components/ui';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';
import type { Category, Transaction } from '@/types';
import { getCategoryName } from '@/utils/categories';
import { formatDisplayDate } from '@/utils/dateFormat';
import { formatMinor } from '@/utils/money';

interface TransactionCardProps {
  transaction: Transaction;
  category: Category | undefined;
  onPress?: () => void;
}

/** One row: category icon, title, "category - date" and the signed amount (+ income / - expense). */
export function TransactionCard({ transaction, category, onPress }: TransactionCardProps) {
  const { colors, spacing, radius, touchTarget } = useTheme();
  const { t, language } = useI18n();

  const isIncome = transaction.type === 'income';
  const signedMinor = isIncome ? transaction.amountMinor : -transaction.amountMinor;
  const amount = formatMinor(signedMinor, transaction.currency, language, { sign: true });
  const categoryName = getCategoryName(category, t);
  const date = formatDisplayDate(transaction.date, language);
  const typeLabel = isIncome ? t('types.income') : t('types.expense');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${transaction.title}, ${typeLabel}, ${amount}, ${categoryName}, ${date}`}
      style={({ pressed }) => ({
        minHeight: touchTarget,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: radius.md,
        backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      })}>
      <CategoryBadge icon={category?.icon ?? 'tag'} color={category?.color ?? null} />
      <View style={{ flex: 1 }}>
        <AppText numberOfLines={1} style={{ fontWeight: '600' }}>
          {transaction.title}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          {categoryName} · {date}
        </AppText>
      </View>
      <AppText style={{ color: isIncome ? colors.income : colors.expense, fontWeight: '700' }}>
        {amount}
      </AppText>
    </Pressable>
  );
}
