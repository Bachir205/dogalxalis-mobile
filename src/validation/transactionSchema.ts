import { z } from 'zod';

import type { CurrencyCode } from '@/constants/currencies';
import type { TranslationKey } from '@/i18n';
import type { Category, NewTransactionInput, TransactionType } from '@/types';
import { isValidDate } from '@/utils/date';
import { parseAmountInput, type AmountError } from '@/utils/money';

export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 200;

/** What the form holds: everything is text until it has been validated. */
export interface TransactionFormValues {
  type: TransactionType;
  title: string;
  amount: string;
  categoryId: string;
  date: string;
  description: string;
}

// Error messages are translation keys; the screen translates them with t().
const AMOUNT_MESSAGES: Record<AmountError, TranslationKey> = {
  empty: 'validation.amountRequired',
  invalid: 'validation.amountInvalid',
  tooManyDecimals: 'validation.amountTooManyDecimals',
  notPositive: 'validation.amountNotPositive',
  tooLarge: 'validation.amountTooLarge',
};

export function createTransactionSchema(currency: CurrencyCode, categories: readonly Category[]) {
  return z
    .object({
      type: z.enum(['income', 'expense']),
      title: z
        .string()
        .trim()
        .min(1, 'validation.titleRequired')
        .max(TITLE_MAX, 'validation.titleTooLong'),
      amount: z.string().superRefine((value, ctx) => {
        const result = parseAmountInput(value, currency);
        if (!result.ok) ctx.addIssue({ code: 'custom', message: AMOUNT_MESSAGES[result.error] });
      }),
      categoryId: z.string().min(1, 'validation.categoryRequired'),
      date: z.string().refine(isValidDate, 'validation.dateInvalid'),
      description: z.string().trim().max(DESCRIPTION_MAX, 'validation.descriptionTooLong'),
    })
    .superRefine((values, ctx) => {
      if (values.categoryId === '') return;
      const category = categories.find((item) => item.id === values.categoryId);
      if (!category) {
        ctx.addIssue({ code: 'custom', path: ['categoryId'], message: 'validation.categoryNotFound' });
      } else if (category.type !== values.type) {
        ctx.addIssue({
          code: 'custom',
          path: ['categoryId'],
          message: 'validation.categoryTypeMismatch',
        });
      }
    });
}

/** Converts validated form values into the record fields. Call it only after validation passed. */
export function buildTransactionInput(
  values: TransactionFormValues,
  currency: CurrencyCode,
): NewTransactionInput {
  const amount = parseAmountInput(values.amount, currency);
  if (!amount.ok) throw new Error('buildTransactionInput called with an invalid amount');
  const description = values.description.trim();
  return {
    title: values.title.trim(),
    amountMinor: amount.minor,
    currency,
    type: values.type,
    categoryId: values.categoryId,
    description: description === '' ? null : description,
    date: values.date,
  };
}
