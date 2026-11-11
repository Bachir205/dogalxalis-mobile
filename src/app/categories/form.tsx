import { Stack, useLocalSearchParams } from 'expo-router';
import { Tag } from 'lucide-react-native';

import { ShellScreen } from '@/components/ui';
import { useI18n } from '@/hooks/useI18n';

/** Category form (modal). Create when there is no ?id=, edit otherwise. Form arrives in Phase 4. */
export default function CategoryFormScreen() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const title = id ? t('nav.editCategory') : t('nav.newCategory');

  return (
    <>
      <Stack.Screen options={{ title }} />
      <ShellScreen
        icon={Tag}
        title={title}
        message={id ? t('categories.editingId', { id }) : t('categories.formMessage')}
      />
    </>
  );
}
