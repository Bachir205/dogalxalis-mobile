import { Stack, useLocalSearchParams } from 'expo-router';
import { Target } from 'lucide-react-native';

import { ShellScreen } from '@/components/ui';
import { useI18n } from '@/hooks/useI18n';

/** Budget form (modal). Create when there is no ?id=, edit otherwise. Form arrives in Phase 5. */
export default function BudgetFormScreen() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const title = id ? t('nav.editBudget') : t('nav.newBudget');

  return (
    <>
      <Stack.Screen options={{ title }} />
      <ShellScreen
        icon={Target}
        title={title}
        message={id ? t('budgets.editingId', { id }) : t('budgets.formMessage')}
      />
    </>
  );
}
