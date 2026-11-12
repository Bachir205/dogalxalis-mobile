import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Tag } from 'lucide-react-native';

import { CategoryForm } from '@/components/categories/CategoryForm';
import { EmptyState, ScreenContainer } from '@/components/ui';
import { useCategories } from '@/hooks/useCategories';
import { useI18n } from '@/hooks/useI18n';

/** Category form (modal). Create when there is no ?id=, edit otherwise. */
export default function CategoryFormScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { categoriesById } = useCategories();
  const category = id ? categoriesById[id] : undefined;
  const title = id ? t('nav.editCategory') : t('nav.newCategory');

  return (
    <ScreenContainer scroll>
      <Stack.Screen options={{ title }} />
      {id && !category ? (
        <EmptyState icon={Tag} title={t('categories.notFoundTitle')} message={t('errors.notFound')} />
      ) : (
        <CategoryForm category={category} onSaved={() => router.back()} />
      )}
    </ScreenContainer>
  );
}
