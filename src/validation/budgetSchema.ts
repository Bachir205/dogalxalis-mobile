import { z } from 'zod';

import type { CurrencyCode } from '@/constants/currencies';
import type { TranslationKey } from '@/i18n';
import type { Budget, Category, NewBudgetInput } from '@/types';
import { isValidMonth } from '@/utils/date';
import { parseAmountInput, type AmountError } from '@/utils/money';

/** What the form holds: the limit is text until it has been validated. */
export interface BudgetFormValues {
  categoryId: string;
  amount: string;
  /** YYYY-MM */
  month: string;
}

const AMOUNT_MESSAGES: Record<AmountError, TranslationKey> = {
  empty: 'validation.amountRequired',
  invalid: 'validation.amountInvalid',
  tooManyDecimals: 'validation.amountTooManyDecimals',
  notPositive: 'validation.amountNotPositive',
  tooLarge: 'validation.amountTooLarge',
};

interface BudgetSchemaOptions {
  currency: CurrencyCode;
  categories: readonly Category[];
  /** The existing budgets, to refuse a duplicate. */
  budgets: readonly Budget[];
  /** The budget being edited, so it does not clash with itself. */
  editingId?: string;
}

/** Rules: limit > 0, existing EXPENSE category, valid month, no duplicate (category + month + currency). */
export function createBudgetSchema({ currency, categories, budgets, editingId }: BudgetSchemaOptions) {
  return z
    .object({
      categoryId: z.string().min(1, 'validation.categoryRequired'),
      amount: z.string().superRefine((value, ctx) => {
        const result = parseAmountInput(value, currency);
        if (!result.ok) ctx.addIssue({ code: 'custom', message: AMOUNT_MESSAGES[result.error] });
      }),
      month: z.string().refine(isValidMonth, 'validation.monthInvalid'),
    })
    .superRefine((values, ctx) => {
      if (values.categoryId === '') return;
      const category = categories.find((item) => item.id === values.categoryId);
      if (!category) {
        ctx.addIssue({ code: 'custom', path: ['categoryId'], message: 'validation.categoryNotFound' });
        return;
      }
      if (category.type !== 'expense') {
        ctx.addIssue({ code: 'custom', path: ['categoryId'], message: 'validation.budgetCategoryNotExpense' });
        return;
      }
      const duplicate = budgets.some(
        (budget) =>
          budget.id !== editingId &&
          budget.categoryId === values.categoryId &&
          budget.month === values.month &&
          budget.currency === currency,
      );
      if (duplicate) {
        ctx.addIssue({ code: 'custom', path: ['categoryId'], message: 'validation.budgetDuplicate' });
      }
    });
}

/** Converts validated form values into record fields. Call it only after validation passed. */
export function buildBudgetInput(values: BudgetFormValues, currency: CurrencyCode): NewBudgetInput {
  const amount = parseAmountInput(values.amount, currency);
  if (!amount.ok) throw new Error('buildBudgetInput called with an invalid amount');
  return { categoryId: values.categoryId, amountMinor: amount.minor, currency, month: values.month };
}
