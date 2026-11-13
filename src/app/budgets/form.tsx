import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { PiggyBank } from 'lucide-react-native';

import { BudgetForm } from '@/components/budgets/BudgetForm';
import { EmptyState, ScreenContainer } from '@/components/ui';
import { useBudgets } from '@/hooks/useBudgets';
import { useI18n } from '@/hooks/useI18n';
import { getCurrentMonth, isValidMonth } from '@/utils/date';

/** Budget form (modal). Create when there is no ?id=, edit otherwise; ?month= preselects the month. */
export default function BudgetFormScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { id, month } = useLocalSearchParams<{ id?: string; month?: string }>();
  const { budgets } = useBudgets();
  const budget = id ? budgets.find((item) => item.id === id) : undefined;
  const title = id ? t('nav.editBudget') : t('nav.newBudget');
  const initialMonth = month && isValidMonth(month) ? month : getCurrentMonth();

  return (
    <ScreenContainer scroll>
      <Stack.Screen options={{ title }} />
      {id && !budget ? (
        <EmptyState icon={PiggyBank} title={t('budgets.notFoundTitle')} message={t('errors.notFound')} />
      ) : (
        <BudgetForm budget={budget} initialMonth={initialMonth} onSaved={() => router.back()} />
      )}
    </ScreenContainer>
  );
}
