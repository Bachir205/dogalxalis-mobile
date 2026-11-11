import { useRouter } from 'expo-router';
import { PiggyBank } from 'lucide-react-native';

import { ShellScreen } from '@/components/ui';
import { useI18n } from '@/hooks/useI18n';

/** Budgets tab. Phase 2 shell; monthly budgets arrive in Phase 5. */
export default function BudgetsScreen() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <ShellScreen
      edges={[]}
      icon={PiggyBank}
      title={t('budgets.title')}
      message={`${t('budgets.message')} ${t('common.comingIn', { phase: 5 })}`}
      actions={[{ label: t('budgets.add'), onPress: () => router.push('/budgets/form') }]}
    />
  );
}
