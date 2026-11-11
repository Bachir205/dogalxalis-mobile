import { useRouter } from 'expo-router';
import { LayoutDashboard, Plus } from 'lucide-react-native';

import { ShellScreen } from '@/components/ui';
import { useI18n } from '@/hooks/useI18n';

/** Home tab (Dashboard). Phase 2 shell; the real dashboard arrives in Phase 4. */
export default function HomeScreen() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <ShellScreen
      edges={[]}
      icon={LayoutDashboard}
      title={t('home.title')}
      message={`${t('home.message')} ${t('common.comingIn', { phase: 4 })}`}
      fab={{
        icon: Plus,
        label: t('common.addTransaction'),
        onPress: () => router.push('/transactions/new'),
      }}
    />
  );
}
