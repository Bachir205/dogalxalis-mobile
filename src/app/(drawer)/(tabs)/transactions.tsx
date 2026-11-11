import { useRouter } from 'expo-router';
import { ArrowLeftRight, Plus } from 'lucide-react-native';

import { ShellScreen } from '@/components/ui';
import { useI18n } from '@/hooks/useI18n';

/** Transactions tab. Phase 2 shell; list, search and filters arrive in Phase 4. */
export default function TransactionsScreen() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <ShellScreen
      edges={[]}
      icon={ArrowLeftRight}
      title={t('transactions.title')}
      message={`${t('transactions.message')} ${t('common.comingIn', { phase: 4 })}`}
      actions={[
        {
          label: t('transactions.openSample'),
          onPress: () => router.push({ pathname: '/transactions/[id]', params: { id: 'sample' } }),
        },
      ]}
      fab={{
        icon: Plus,
        label: t('common.addTransaction'),
        onPress: () => router.push('/transactions/new'),
      }}
    />
  );
}
