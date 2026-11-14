import { z } from 'zod';

/** Validation of every request body. `.strict()` rejects unknown fields (for example syncStatus). */
const id = z.string().min(1).max(64);
const timestamp = z
  .string()
  .min(1)
  .max(40)
  .refine((value) => !Number.isNaN(Date.parse(value)), 'must be an ISO timestamp');
const entryType = z.enum(['income', 'expense']);
const currency = z.enum(['XOF', 'EUR', 'USD']);
const amountMinor = z.number().int().positive().max(1_000_000_000_000);

function isRealDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (year < 1900 || year > 2200) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export const categoryBody = z
  .object({
    id,
    name: z.string().trim().min(1).max(30),
    type: entryType,
    icon: z.string().min(1).max(32),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable(),
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  .strict();

export const transactionBody = z
  .object({
    id,
    title: z.string().trim().min(1).max(60),
    amountMinor,
    currency,
    type: entryType,
    categoryId: id,
    description: z.string().max(200).nullable(),
    date: z.string().refine(isRealDate, 'must be a real date (YYYY-MM-DD)'),
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  .strict();

export const budgetBody = z
  .object({
    id,
    categoryId: id,
    amountMinor,
    currency,
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'must be YYYY-MM'),
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  .strict();
