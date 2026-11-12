import { View } from 'react-native';

import { AppText, Chip } from '@/components/ui';
import { getCategoryIcon } from '@/constants/categoryIcons';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';
import type { Category } from '@/types';
import { getCategoryName } from '@/utils/categories';

interface CategorySelectorProps {
  /** Only the categories that may be chosen (already filtered by transaction type). */
  categories: readonly Category[];
  selectedId: string;
  onSelect: (id: string) => void;
  label: string;
  /** Already translated message. */
  error?: string;
}

export function CategorySelector({ categories, selectedId, onSelect, label, error }: CategorySelectorProps) {
  const { spacing } = useTheme();
  const { t } = useI18n();
  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      {categories.length === 0 ? (
        <AppText tone="muted">{t('transactions.form.noCategories')}</AppText>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {categories.map((category) => (
            <Chip
              key={category.id}
              label={getCategoryName(category, t)}
              icon={getCategoryIcon(category.icon)}
              selected={category.id === selectedId}
              onPress={() => onSelect(category.id)}
            />
          ))}
        </View>
      )}
      {error ? (
        <AppText variant="caption" tone="error" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
