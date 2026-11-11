import { FilePlus } from 'lucide-react-native';

import { ShellScreen } from '@/components/ui';
import { useI18n } from '@/hooks/useI18n';

/** New transaction (modal). Form arrives in Phase 4. */
export default function NewTransactionScreen() {
  const { t } = useI18n();
  return (
    <ShellScreen
      icon={FilePlus}
      title={t('nav.newTransaction')}
      message={t('transactions.formMessage')}
    />
  );
}
