import { z } from 'zod';

/**
 * Shape of what the server sends back. Every response is validated before it touches the
 * local database, so a broken or unexpected answer cannot corrupt the saved data.
 */
const id = z.string().min(1);
const entryType = z.enum(['income', 'expense']);
const currency = z.enum(['XOF', 'EUR', 'USD']);

export const apiCategorySchema = z.object({
  id,
  name: z.string().min(1),
  type: entryType,
  icon: z.string().min(1),
  color: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const apiTransactionSchema = z.object({
  id,
  title: z.string().min(1),
  amountMinor: z.number().int().positive(),
  currency,
  type: entryType,
  categoryId: id,
  description: z.string().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const apiBudgetSchema = z.object({
  id,
  categoryId: id,
  amountMinor: z.number().int().positive(),
  currency,
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const apiErrorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string().optional() }),
});

export type ApiCategory = z.infer<typeof apiCategorySchema>;
export type ApiTransaction = z.infer<typeof apiTransactionSchema>;
export type ApiBudget = z.infer<typeof apiBudgetSchema>;
