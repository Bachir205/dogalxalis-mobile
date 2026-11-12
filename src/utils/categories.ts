import { DEFAULT_CATEGORIES } from '@/constants/defaultCategories';
import type { TranslationKey } from '@/i18n';
import type { Category } from '@/types';

/**
 * Name to show. The seeded categories are stored in English but displayed in the user's
 * language; if the user renamed one, their own name is shown as typed.
 */
export function getCategoryName(
  category: Category | undefined,
  t: (key: TranslationKey) => string,
): string {
  if (!category) return '—';
  const seeded = DEFAULT_CATEGORIES.find((item) => item.id === category.id);
  return seeded && category.name === seeded.name ? t(seeded.nameKey) : category.name;
}
