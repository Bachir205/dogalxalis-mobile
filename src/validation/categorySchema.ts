import { z } from 'zod';

import { CATEGORY_COLORS, CATEGORY_ICON_NAMES } from '@/constants/categoryIcons';
import type { Category, TransactionType } from '@/types';

export const CATEGORY_NAME_MAX = 30;

export interface CategoryFormValues {
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
}

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** `editingId`: the category being edited, so it does not clash with itself. */
export function createCategorySchema(existing: readonly Category[], editingId?: string) {
  return z
    .object({
      name: z
        .string()
        .trim()
        .min(1, 'validation.nameRequired')
        .max(CATEGORY_NAME_MAX, 'validation.nameTooLong'),
      type: z.enum(['income', 'expense']),
      icon: z.string().refine((value) => CATEGORY_ICON_NAMES.includes(value), 'validation.iconInvalid'),
      color: z
        .string()
        .refine((value) => (CATEGORY_COLORS as readonly string[]).includes(value), 'validation.colorInvalid'),
    })
    .superRefine((values, ctx) => {
      const clash = existing.some(
        (category) =>
          category.id !== editingId &&
          category.type === values.type &&
          sameName(category.name, values.name),
      );
      if (clash) ctx.addIssue({ code: 'custom', path: ['name'], message: 'validation.nameDuplicate' });
    });
}
