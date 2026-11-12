import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/ui';
import { TransactionForm } from '@/components/transactions/TransactionForm';

/** New transaction (modal). */
export default function NewTransactionScreen() {
  const router = useRouter();
  return (
    <ScreenContainer scroll>
      <TransactionForm onSaved={() => router.back()} />
    </ScreenContainer>
  );
}
