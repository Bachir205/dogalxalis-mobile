import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { DEFAULT_CURRENCY, isCurrencyCode, type CurrencyCode } from '@/constants/currencies';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import { isLanguage, type Language } from '@/i18n';
import { detectDeviceLanguage } from '@/i18n/device';
import { loadStored, saveStored } from '@/services/storage';

interface Preferences {
  language: Language;
  currency: CurrencyCode;
}

export interface PreferencesContextValue extends Preferences {
  setLanguage: (language: Language) => void;
  setCurrency: (currency: CurrencyCode) => void;
  /** False until the saved preferences have been read from storage. */
  isReady: boolean;
}

export const PreferencesContext = createContext<PreferencesContextValue | null>(null);

/** Keeps only the valid fields of whatever was stored (older or corrupted data is ignored). */
function parsePreferences(raw: unknown): Partial<Preferences> | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const record = raw as Record<string, unknown>;
  const result: Partial<Preferences> = {};
  if (isLanguage(record.language)) result.language = record.language;
  if (isCurrencyCode(record.currency)) result.currency = record.currency;
  return result;
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(() => ({
    language: detectDeviceLanguage(),
    currency: DEFAULT_CURRENCY,
  }));
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadStored(STORAGE_KEYS.preferences, parsePreferences).then((stored) => {
      if (cancelled) return;
      if (stored) setPreferences((current) => ({ ...current, ...stored }));
      setIsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isReady) void saveStored(STORAGE_KEYS.preferences, preferences);
  }, [preferences, isReady]);

  const setLanguage = useCallback(
    (language: Language) => setPreferences((current) => ({ ...current, language })),
    [],
  );
  const setCurrency = useCallback(
    (currency: CurrencyCode) => setPreferences((current) => ({ ...current, currency })),
    [],
  );

  const value = useMemo<PreferencesContextValue>(
    () => ({ ...preferences, setLanguage, setCurrency, isReady }),
    [preferences, setLanguage, setCurrency, isReady],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}
