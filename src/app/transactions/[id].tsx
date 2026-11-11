import { useLocalSearchParams, useRouter } from 'expo-router';
import { ReceiptText } from 'lucide-react-native';

import { ShellScreen } from '@/components/ui';
import { useI18n } from '@/hooks/useI18n';

/** Transaction details. Real fields and Delete arrive in Phase 4. */
export default function TransactionDetailScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ShellScreen
      icon={ReceiptText}
      title={t('nav.transactionDetails')}
      message={t('transactions.detailId', { id })}
      actions={[
        {
          label: t('transactions.edit'),
          onPress: () => router.push({ pathname: '/transactions/edit/[id]', params: { id } }),
        },
      ]}
    />
  );
}
