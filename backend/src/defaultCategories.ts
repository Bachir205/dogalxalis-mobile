import type { Category } from './types';

/** Same ids, names, icons and colors as the app, so both sides agree on them from the start. */
const DEFAULTS: Omit<Category, 'createdAt' | 'updatedAt'>[] = [
  { id: 'cat_food', name: 'Food', type: 'expense', icon: 'utensils', color: '#E67E22' },
  { id: 'cat_transport', name: 'Transport', type: 'expense', icon: 'car', color: '#3498DB' },
  { id: 'cat_shopping', name: 'Shopping', type: 'expense', icon: 'shopping-bag', color: '#9B59B6' },
  { id: 'cat_bills', name: 'Bills', type: 'expense', icon: 'receipt', color: '#E74C3C' },
  { id: 'cat_health', name: 'Health', type: 'expense', icon: 'heart-pulse', color: '#E91E63' },
  { id: 'cat_education', name: 'Education', type: 'expense', icon: 'graduation-cap', color: '#1ABC9C' },
  { id: 'cat_entertainment', name: 'Entertainment', type: 'expense', icon: 'gamepad-2', color: '#F39C12' },
  { id: 'cat_other_expense', name: 'Other', type: 'expense', icon: 'tag', color: '#7F8C8D' },
  { id: 'cat_salary', name: 'Salary', type: 'income', icon: 'banknote', color: '#27AE60' },
  { id: 'cat_allowance', name: 'Allowance', type: 'income', icon: 'wallet', color: '#2ECC71' },
  { id: 'cat_freelance', name: 'Freelance', type: 'income', icon: 'laptop', color: '#16A085' },
  { id: 'cat_business', name: 'Business', type: 'income', icon: 'briefcase', color: '#2980B9' },
  { id: 'cat_other_income', name: 'Other', type: 'income', icon: 'tag', color: '#95A5A6' },
];

export function createDefaultCategories(now: string = new Date().toISOString()): Category[] {
  return DEFAULTS.map((category) => ({ ...category, createdAt: now, updatedAt: now }));
}
