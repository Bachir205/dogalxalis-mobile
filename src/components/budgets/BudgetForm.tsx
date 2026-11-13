import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { CategorySelector } from '@/components/categories/CategorySelector';
import { AppButton, AppInput, AppText, confirmAction, MonthSwitcher } from '@/components/ui';
import { CURRENCIES } from '@/constants/currencies';
import { DataError } from '@/database/errors';
import { useBudgets } from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useCategories';
import { useI18n } from '@/hooks/useI18n';
import { usePreferences } from '@/hooks/usePreferences';
import { useTheme } from '@/hooks/useTheme';
import type { Budget } from '@/types';
import { getCategoryName } from '@/utils/categories';
import { shiftMonth } from '@/utils/date';
import { formatMonthLabel } from '@/utils/dateFormat';
import { minorToInputString } from '@/utils/money';
import {
  buildBudgetInput,
  createBudgetSchema,
  type BudgetFormValues,
} from '@/validation/budgetSchema';
import { translateError } from '@/validation/translateError';

interface BudgetFormProps {
  /** Present when editing. */
  budget?: Budget;
  /** Month preselected for a new budget (YYYY-MM). */
  initialMonth: string;
  onSaved: () => void;
}

/** Create / edit a monthly budget. The currency is the app currency and cannot be edited. */
export function BudgetForm({ budget, initialMonth, onSaved }: BudgetFormProps) {
  const { t, language } = useI18n();
  const { spacing } = useTheme();
  const { categories, categoriesById } = useCategories();
  const { budgets, createBudget, updateBudget, removeBudget } = useBudgets();
  const { currency: preferredCurrency } = usePreferences();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currency = budget?.currency ?? preferredCurrency;
  const expenseCategories = useMemo(
    () => categories.filter((category) => category.type === 'expense'),
    [categories],
  );
  const schema = useMemo(
    () => createBudgetSchema({ currency, categories, budgets, editingId: budget?.id }),
    [currency, categories, budgets, budget?.id],
  );

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(schema),
    defaultValues: budget
      ? {
          categoryId: budget.categoryId,
          amount: minorToInputString(budget.amountMinor, budget.currency),
          month: budget.month,
        }
      : { categoryId: '', amount: '', month: initialMonth },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      const input = buildBudgetInput(values, currency);
      if (budget) await updateBudget(budget.id, input);
      else await createBudget(input);
      onSaved();
    } catch (error) {
      if (error instanceof DataError && error.code === 'DUPLICATE') {
        setError('categoryId', { message: 'validation.budgetDuplicate' });
      } else {
        console.warn('Could not save the budget', error);
        setSubmitError(t('errors.saveFailed'));
      }
    }
  });

  const askDelete = () => {
    if (!budget) return;
    confirmAction({
      title: t('budgets.deleteTitle'),
      message: t('budgets.deleteMessage', {
        category: getCategoryName(categoriesById[budget.categoryId], t),
        month: formatMonthLabel(budget.month, language),
      }),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      onConfirm: async () => {
        try {
          await removeBudget(budget.id);
          onSaved();
        } catch (error) {
          console.warn('Could not delete the budget', error);
          setSubmitError(t('errors.saveFailed'));
        }
      },
    });
  };

  return (
    <View style={{ gap: spacing.lg }}>
      <Controller
        control={control}
        name="categoryId"
        render={({ field }) => (
          <CategorySelector
            label={t('budgets.form.category')}
            categories={expenseCategories}
            selectedId={field.value}
            onSelect={field.onChange}
            error={translateError(t, errors.categoryId?.message)}
          />
        )}
      />

      <Controller
        control={control}
        name="amount"
        render={({ field }) => (
          <AppInput
            label={t('budgets.form.amount', { currency: CURRENCIES[currency].symbol })}
            placeholder={t('transactions.form.amountPlaceholder')}
            keyboardType={CURRENCIES[currency].exponent === 0 ? 'number-pad' : 'decimal-pad'}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={translateError(t, errors.amount?.message)}
          />
        )}
      />

      <Controller
        control={control}
        name="month"
        render={({ field }) => (
          <View style={{ gap: spacing.xs }}>
            <AppText variant="caption" tone="muted">
              {t('budgets.form.month')}
            </AppText>
            <MonthSwitcher
              month={field.value}
              onPrevious={() => field.onChange(shiftMonth(field.value, -1))}
              onNext={() => field.onChange(shiftMonth(field.value, 1))}
            />
          </View>
        )}
      />

      <View style={{ gap: spacing.xs }}>
        <AppText variant="caption" tone="muted">
          {t('budgets.form.currency')}
        </AppText>
        <AppText>{`${currency} (${CURRENCIES[currency].symbol})`}</AppText>
      </View>

      {submitError ? (
        <AppText tone="error" accessibilityLiveRegion="polite">
          {submitError}
        </AppText>
      ) : null}

      <AppButton label={t('common.save')} onPress={onSubmit} loading={isSubmitting} />
      {budget ? <AppButton variant="danger" label={t('common.delete')} onPress={askDelete} /> : null}
    </View>
  );
}
