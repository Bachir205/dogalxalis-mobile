import type { TranslationKey } from '@/i18n';

/** Form errors are translation keys (see the Zod schemas). Turns one into text for the screen. */
export function translateError(
  t: (key: TranslationKey) => string,
  message: string | undefined,
): string | undefined {
  return message ? t(message as TranslationKey) : undefined;
}
