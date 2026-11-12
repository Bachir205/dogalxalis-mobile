import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { CategorySelector } from '@/components/categories/CategorySelector';
import { AppButton, AppInput, AppText, Chip, SegmentedControl } from '@/components/ui';
import { CURRENCIES } from '@/constants/currencies';
import { useCategories } from '@/hooks/useCategories';
import { useI18n } from '@/hooks/useI18n';
import { usePreferences } from '@/hooks/usePreferences';
import { useTheme } from '@/hooks/useTheme';
import { useTransactions } from '@/hooks/useTransactions';
import type { Transaction, TransactionType } from '@/types';
import { getToday, shiftDate } from '@/utils/date';
import { minorToInputString } from '@/utils/money';
import { translateError } from '@/validation/translateError';
import {
  buildTransactionInput,
  createTransactionSchema,
  DESCRIPTION_MAX,
  TITLE_MAX,
  type TransactionFormValues,
} from '@/validation/transactionSchema';

interface TransactionFormProps {
  /** Present when editing. */
  transaction?: Transaction;
  onSaved: () => void;
}

/** Create / edit form. React Hook Form holds the fields, Zod validates them. */
export function TransactionForm({ transaction, onSaved }: TransactionFormProps) {
  const { t } = useI18n();
  const { spacing } = useTheme();
  const { categories } = useCategories();
  const { addTransaction, updateTransaction } = useTransactions();
  const { currency: preferredCurrency } = usePreferences();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Editing keeps the transaction's own currency; a new one uses the currency from Settings.
  const currency = transaction?.currency ?? preferredCurrency;
  const schema = useMemo(() => createTransactionSchema(currency, categories), [currency, categories]);

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: transaction
      ? {
          type: transaction.type,
          title: transaction.title,
          amount: minorToInputString(transaction.amountMinor, transaction.currency),
          categoryId: transaction.categoryId,
          date: transaction.date,
          description: transaction.description ?? '',
        }
      : { type: 'expense', title: '', amount: '', categoryId: '', date: getToday(), description: '' },
  });

  const type = watch('type');
  const categoriesForType = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type],
  );

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      const input = buildTransactionInput(values, currency);
      if (transaction) await updateTransaction(transaction.id, input);
      else await addTransaction(input);
      onSaved();
    } catch (error) {
      console.warn('Could not save the transaction', error);
      setSubmitError(t('errors.saveFailed'));
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
        name="type"
        render={({ field }) => (
          <SegmentedControl<TransactionType>
            accessibilityLabel={t('transactions.type')}
            options={typeOptions}
            value={field.value}
            onChange={(next) => {
              field.onChange(next);
              // A category of the other type is no longer valid: ask for a new choice.
              const chosen = categories.find((category) => category.id === getValues('categoryId'));
              if (chosen && chosen.type !== next) setValue('categoryId', '');
            }}
          />
        )}
      />

      <Controller
        control={control}
        name="title"
        render={({ field }) => (
          <AppInput
            label={t('transactions.form.title')}
            placeholder={t('transactions.form.titlePlaceholder')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            maxLength={TITLE_MAX + 20}
            error={translateError(t, errors.title?.message)}
          />
        )}
      />

      <Controller
        control={control}
        name="amount"
        render={({ field }) => (
          <AppInput
            label={t('transactions.form.amount', { currency: CURRENCIES[currency].symbol })}
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
        name="categoryId"
        render={({ field }) => (
          <CategorySelector
            label={t('transactions.form.category')}
            categories={categoriesForType}
            selectedId={field.value}
            onSelect={field.onChange}
            error={translateError(t, errors.categoryId?.message)}
          />
        )}
      />

      <View style={{ gap: spacing.sm }}>
        <Controller
          control={control}
          name="date"
          render={({ field }) => (
            <AppInput
              label={t('transactions.form.date')}
              placeholder={t('transactions.form.datePlaceholder')}
              keyboardType="numbers-and-punctuation"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              maxLength={10}
              error={translateError(t, errors.date?.message)}
            />
          )}
        />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Chip
            label={t('common.today')}
            selected={watch('date') === getToday()}
            onPress={() => setValue('date', getToday(), { shouldValidate: true })}
          />
          <Chip
            label={t('common.yesterday')}
            selected={watch('date') === shiftDate(getToday(), -1)}
            onPress={() => setValue('date', shiftDate(getToday(), -1), { shouldValidate: true })}
          />
        </View>
      </View>

      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <AppInput
            label={t('transactions.form.description')}
            placeholder={t('transactions.form.descriptionPlaceholder')}
            multiline
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            maxLength={DESCRIPTION_MAX + 50}
            error={translateError(t, errors.description?.message)}
          />
        )}
      />

      {submitError ? (
        <AppText tone="error" accessibilityLiveRegion="polite">
          {submitError}
        </AppText>
      ) : null}

      {/* While saving the button is inactive, so a double tap cannot create two records. */}
      <AppButton label={t('common.save')} onPress={onSubmit} loading={isSubmitting} />
    </View>
  );
}
