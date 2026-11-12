import type { TranslationKey } from '@/i18n';
import type { TransactionType } from '@/types';

export interface DefaultCategory {
  id: string;
  /** Canonical (English) name stored in the database. */
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  nameKey: TranslationKey;
}

/** Seeded by migration 1. Fixed ids so the app and the API agree on them. */
export const DEFAULT_CATEGORIES: readonly DefaultCategory[] = [
  { id: 'cat_food', name: 'Food', type: 'expense', icon: 'utensils', color: '#E67E22', nameKey: 'categoryNames.cat_food' },
  { id: 'cat_transport', name: 'Transport', type: 'expense', icon: 'car', color: '#3498DB', nameKey: 'categoryNames.cat_transport' },
  { id: 'cat_shopping', name: 'Shopping', type: 'expense', icon: 'shopping-bag', color: '#9B59B6', nameKey: 'categoryNames.cat_shopping' },
  { id: 'cat_bills', name: 'Bills', type: 'expense', icon: 'receipt', color: '#E74C3C', nameKey: 'categoryNames.cat_bills' },
  { id: 'cat_health', name: 'Health', type: 'expense', icon: 'heart-pulse', color: '#E91E63', nameKey: 'categoryNames.cat_health' },
  { id: 'cat_education', name: 'Education', type: 'expense', icon: 'graduation-cap', color: '#1ABC9C', nameKey: 'categoryNames.cat_education' },
  { id: 'cat_entertainment', name: 'Entertainment', type: 'expense', icon: 'gamepad-2', color: '#F39C12', nameKey: 'categoryNames.cat_entertainment' },
  { id: 'cat_other_expense', name: 'Other', type: 'expense', icon: 'tag', color: '#7F8C8D', nameKey: 'categoryNames.cat_other' },
  { id: 'cat_salary', name: 'Salary', type: 'income', icon: 'banknote', color: '#27AE60', nameKey: 'categoryNames.cat_salary' },
  { id: 'cat_allowance', name: 'Allowance', type: 'income', icon: 'wallet', color: '#2ECC71', nameKey: 'categoryNames.cat_allowance' },
  { id: 'cat_freelance', name: 'Freelance', type: 'income', icon: 'laptop', color: '#16A085', nameKey: 'categoryNames.cat_freelance' },
  { id: 'cat_business', name: 'Business', type: 'income', icon: 'briefcase', color: '#2980B9', nameKey: 'categoryNames.cat_business' },
  { id: 'cat_other_income', name: 'Other', type: 'income', icon: 'tag', color: '#95A5A6', nameKey: 'categoryNames.cat_other' },
];
