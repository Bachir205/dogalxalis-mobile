import { useCallback, useMemo } from 'react';

import { translate, type Language, type TranslationKey, type TranslationParams } from '@/i18n';
import { detectDeviceLanguage } from '@/i18n/device';

/**
 * Phase 1: language = device language.
 * Phase 3 reads it from PreferencesContext so the user can switch FR/EN in Settings.
 */
export function useI18n() {
  const language: Language = useMemo(() => detectDeviceLanguage(), []);
  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams) => translate(language, key, params),
    [language],
  );
  return { language, t };
}
