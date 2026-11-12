import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, View } from 'react-native';

import { AppButton, AppInput, AppText, SegmentedControl } from '@/components/ui';
import { CATEGORY_COLORS, CATEGORY_ICON_NAMES, getCategoryIcon } from '@/constants/categoryIcons';
import { DataError } from '@/database/errors';
import { useCategories } from '@/hooks/useCategories';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';
import type { Category, TransactionType } from '@/types';
import { translateError } from '@/validation/translateError';
import {
  CATEGORY_NAME_MAX,
  createCategorySchema,
  type CategoryFormValues,
} from '@/validation/categorySchema';

interface CategoryFormProps {
  /** Present when editing. */
  category?: Category;
  onSaved: () => void;
}

export function CategoryForm({ category, onSaved }: CategoryFormProps) {
  const { t } = useI18n();
  const { colors, spacing, radius, touchTarget } = useTheme();
  const { categories, addCategory, updateCategory } = useCategories();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const schema = useMemo(() => createCategorySchema(categories, category?.id), [categories, category?.id]);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: category?.name ?? '',
      type: category?.type ?? 'expense',
      icon: category?.icon ?? 'tag',
      color: category?.color ?? CATEGORY_COLORS[0],
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      if (category) {
        // The type is locked after creation, so only name, icon and color change.
        await updateCategory(category.id, { name: values.name.trim(), icon: values.icon, color: values.color });
      } else {
        await addCategory({ name: values.name.trim(), type: values.type, icon: values.icon, color: values.color });
      }
      onSaved();
    } catch (error) {
      if (error instanceof DataError && error.code === 'DUPLICATE') {
        setError('name', { message: 'validation.nameDuplicate' });
      } else {
        console.warn('Could not save the category', error);
        setSubmitError(t('errors.saveFailed'));
      }
    }
  });

  const typeOptions = [
    { value: 'expense', label: t('types.expense') },
    { value: 'income', label: t('types.income') },
  ] as const;

  return (
    <View style={{ gap: spacing.lg }}>
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <AppInput
            label={t('categories.name')}
            placeholder={t('categories.namePlaceholder')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            maxLength={CATEGORY_NAME_MAX + 10}
            error={translateError(t, errors.name?.message)}
          />
        )}
      />

      <View style={{ gap: spacing.xs }}>
        <AppText variant="caption" tone="muted">
          {t('categories.type')}
        </AppText>
        {category ? (
          <>
            <AppText>{category.type === 'income' ? t('types.income') : t('types.expense')}</AppText>
            <AppText variant="caption" tone="muted">
              {t('categories.typeLocked')}
            </AppText>
          </>
        ) : (
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <SegmentedControl<TransactionType>
                accessibilityLabel={t('categories.type')}
                options={typeOptions}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        )}
      </View>

      <Controller
        control={control}
        name="icon"
        render={({ field }) => (
          <View style={{ gap: spacing.xs }}>
            <AppText variant="caption" tone="muted">
              {t('categories.icon')}
            </AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {CATEGORY_ICON_NAMES.map((name) => {
                const Icon = getCategoryIcon(name);
                const selected = field.value === name;
                return (
                  <Pressable
                    key={name}
                    onPress={() => field.onChange(name)}
                    accessibilityRole="button"
                    accessibilityLabel={name}
                    accessibilityState={{ selected }}
                    style={{
                      width: touchTarget,
                      height: touchTarget,
                      borderRadius: radius.md,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: selected ? 2 : 1,
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? colors.surfaceMuted : colors.surface,
                    }}>
                    <Icon color={selected ? colors.primary : colors.text} size={22} />
                  </Pressable>
                );
              })}
            </View>
            {errors.icon ? <AppText variant="caption" tone="error">{translateError(t, errors.icon.message)}</AppText> : null}
          </View>
        )}
      />

      <Controller
        control={control}
        name="color"
        render={({ field }) => (
          <View style={{ gap: spacing.xs }}>
            <AppText variant="caption" tone="muted">
              {t('categories.color')}
            </AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {CATEGORY_COLORS.map((color) => {
                const selected = field.value === color;
                return (
                  <Pressable
                    key={color}
                    onPress={() => field.onChange(color)}
                    accessibilityRole="button"
                    accessibilityLabel={color}
                    accessibilityState={{ selected }}
                    style={{
                      width: touchTarget - 8,
                      height: touchTarget - 8,
                      borderRadius: (touchTarget - 8) / 2,
                      backgroundColor: color,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: selected ? 3 : 0,
                      borderColor: colors.text,
                    }}>
                    {selected ? <Check color="#FFFFFF" size={20} /> : null}
                  </Pressable>
                );
              })}
            </View>
            {errors.color ? <AppText variant="caption" tone="error">{translateError(t, errors.color.message)}</AppText> : null}
          </View>
        )}
      />

      {submitError ? (
        <AppText tone="error" accessibilityLiveRegion="polite">
          {submitError}
        </AppText>
      ) : null}

      <AppButton label={t('common.save')} onPress={onSubmit} loading={isSubmitting} />
    </View>
  );
}
