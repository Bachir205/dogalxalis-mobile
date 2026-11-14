import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { CategoryBadge } from '@/components/categories/CategoryBadge';
import { SyncBadge } from '@/components/sync/SyncBadge';
import {
  AppText,
  ErrorState,
  FloatingActionButton,
  LoadingState,
  ScreenContainer,
} from '@/components/ui';
import { useCategories } from '@/hooks/useCategories';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';
import type { Category } from '@/types';
import { getCategoryName } from '@/utils/categories';

/** Categories (drawer): expense and income groups. Tap one to edit, + to add. */
export default function CategoriesScreen() {
  const { t } = useI18n();
  const { colors, spacing, radius, touchTarget } = useTheme();
  const router = useRouter();
  const { categories, status, refresh } = useCategories();

  const groups = useMemo(
    () => [
      { key: 'expense', title: t('categories.expenseGroup'), items: categories.filter((c) => c.type === 'expense') },
      { key: 'income', title: t('categories.incomeGroup'), items: categories.filter((c) => c.type === 'income') },
    ],
    [categories, t],
  );

  if (status === 'loading' || status === 'idle') return <LoadingState />;
  if (status === 'error') return <ErrorState message={t('errors.loadFailed')} onRetry={refresh} />;

  const edit = (category: Category) =>
    router.push({ pathname: '/categories/form', params: { id: category.id } });

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer scroll>
        {groups.map((group) => (
          <View key={group.key} style={{ gap: spacing.sm }}>
            <AppText variant="subtitle">{group.title}</AppText>
            {group.items.length === 0 ? (
              <AppText tone="muted">{t('categories.emptyGroup')}</AppText>
            ) : (
              group.items.map((category) => (
                <Pressable
                  key={category.id}
                  onPress={() => edit(category)}
                  accessibilityRole="button"
                  accessibilityLabel={getCategoryName(category, t)}
                  style={({ pressed }) => ({
                    minHeight: touchTarget,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.md,
                    padding: spacing.md,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
                  })}>
                  <CategoryBadge icon={category.icon} color={category.color} />
                  <AppText style={{ flex: 1 }}>{getCategoryName(category, t)}</AppText>
                  <SyncBadge status={category.syncStatus} />
                </Pressable>
              ))
            )}
          </View>
        ))}
        <View style={{ height: 72 }} />
      </ScreenContainer>
      <FloatingActionButton icon={Plus} label={t('categories.add')} onPress={() => router.push('/categories/form')} />
    </View>
  );
}
