import { getLocales } from 'expo-localization';

import type { Language } from './index';

/** French if the device language is French, English otherwise. */
export function detectDeviceLanguage(): Language {
  const code = getLocales()[0]?.languageCode;
  return code === 'fr' ? 'fr' : 'en';
}
