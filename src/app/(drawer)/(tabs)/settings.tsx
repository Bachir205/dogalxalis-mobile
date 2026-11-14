import Constants from 'expo-constants';

import { SyncCard } from '@/components/settings/SyncCard';
import { AppCard, AppText, ScreenContainer, SegmentedControl } from '@/components/ui';
import { CURRENCIES, CURRENCY_CODES } from '@/constants/currencies';
import { usePreferences } from '@/hooks/usePreferences';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';
import type { Language } from '@/i18n';

// Language names are always shown in their own language.
const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
];

const CURRENCY_OPTIONS = CURRENCY_CODES.map((code) => ({
  value: code,
  label: `${code} (${CURRENCIES[code].symbol})`,
}));

/** Settings tab: theme mode, language, currency and application info. */
export default function SettingsScreen() {
  const { t } = useI18n();
  const { mode, setMode } = useTheme();
  const { language, setLanguage, currency, setCurrency } = usePreferences();

  const themeOptions = [
    { value: 'system', label: t('settings.themeSystem') },
    { value: 'light', label: t('settings.themeLight') },
    { value: 'dark', label: t('settings.themeDark') },
  ] as const;

  return (
    <ScreenContainer scroll edges={[]}>
      <AppCard>
        <AppText variant="subtitle">{t('settings.themeTitle')}</AppText>
        <SegmentedControl
          accessibilityLabel={t('settings.themeTitle')}
          options={themeOptions}
          value={mode}
          onChange={setMode}
        />
        <AppText variant="caption" tone="muted">
          {t('settings.themeHint')}
        </AppText>
      </AppCard>

      <AppCard>
        <AppText variant="subtitle">{t('settings.languageTitle')}</AppText>
        <SegmentedControl
          accessibilityLabel={t('settings.languageTitle')}
          options={LANGUAGE_OPTIONS}
          value={language}
          onChange={setLanguage}
        />
      </AppCard>

      <AppCard>
        <AppText variant="subtitle">{t('settings.currencyTitle')}</AppText>
        <SegmentedControl
          accessibilityLabel={t('settings.currencyTitle')}
          options={CURRENCY_OPTIONS}
          value={currency}
          onChange={setCurrency}
        />
        <AppText variant="caption" tone="muted">
          {t('settings.currencyHint')}
        </AppText>
      </AppCard>

      <SyncCard />

      <AppCard>
        <AppText variant="subtitle">{t('settings.appInfoTitle')}</AppText>
        <AppText>{t('app.name')}</AppText>
        <AppText tone="muted">
          {t('settings.appVersion', { version: Constants.expoConfig?.version ?? '1.0.0' })}
        </AppText>
      </AppCard>
    </ScreenContainer>
  );
}
