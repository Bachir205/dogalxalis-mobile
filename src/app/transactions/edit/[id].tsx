import { useLocalSearchParams } from 'expo-router';
import { Pencil } from 'lucide-react-native';

import { ShellScreen } from '@/components/ui';
import { useI18n } from '@/hooks/useI18n';

/** Edit transaction (modal). Form arrives in Phase 4. */
export default function EditTransactionScreen() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ShellScreen
      icon={Pencil}
      title={t('nav.editTransaction')}
      message={`${t('transactions.detailId', { id })} ${t('transactions.formMessage')}`}
    />
  );
}
