import { useRouter } from 'expo-router';
import { Tags } from 'lucide-react-native';

import { ShellScreen } from '@/components/ui';
import { useI18n } from '@/hooks/useI18n';

/** Categories (drawer). Phase 2 shell; list and create/edit arrive in Phase 4. */
export default function CategoriesScreen() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <ShellScreen
      icon={Tags}
      title={t('categories.title')}
      message={`${t('categories.message')} ${t('common.comingIn', { phase: 4 })}`}
      actions={[{ label: t('categories.add'), onPress: () => router.push('/categories/form') }]}
    />
  );
}
