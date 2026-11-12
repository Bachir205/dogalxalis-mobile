import { useLocalSearchParams, useRouter } from 'expo-router';
import { ReceiptText } from 'lucide-react-native';

import { EmptyState, ScreenContainer } from '@/components/ui';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { useI18n } from '@/hooks/useI18n';
import { useTransactions } from '@/hooks/useTransactions';

/** Edit transaction (modal). */
export default function EditTransactionScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { transactions } = useTransactions();
  const transaction = transactions.find((item) => item.id === id);

  return (
    <ScreenContainer scroll>
      {transaction ? (
        <TransactionForm transaction={transaction} onSaved={() => router.back()} />
      ) : (
        <EmptyState icon={ReceiptText} title={t('transactions.notFoundTitle')} message={t('errors.notFound')} />
      )}
    </ScreenContainer>
  );
}
