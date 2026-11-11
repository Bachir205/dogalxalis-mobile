import { useCallback } from 'react';

import { translate, type Language, type TranslationKey, type TranslationParams } from '@/i18n';

import { usePreferences } from './usePreferences';

/** Translation function for the language chosen in Settings (changes live, app-wide). */
export function useI18n() {
  const { language } = usePreferences();
  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams) => translate(language, key, params),
    [language],
  );
  return { language: language as Language, t };
}
