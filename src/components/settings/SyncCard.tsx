import { AppButton, AppCard, AppText } from '@/components/ui';
import { useI18n } from '@/hooks/useI18n';
import { useSync } from '@/hooks/useSync';
import { formatDateTime } from '@/utils/dateFormat';

/** Settings card: is a server configured, when did the last sync happen, what is waiting. */
export function SyncCard() {
  const { t, language } = useI18n();
  const { apiConfigured, state, lastSyncedAt, pending, failed, syncNow } = useSync();

  if (!apiConfigured) {
    return (
      <AppCard>
        <AppText variant="subtitle">{t('sync.title')}</AppText>
        <AppText tone="muted">{t('sync.notConfigured')}</AppText>
      </AppCard>
    );
  }

  const statusText = state === 'disabled' ? t('sync.idle') : t(`sync.${state}`);
  return (
    <AppCard>
      <AppText variant="subtitle">{t('sync.title')}</AppText>
      <AppText accessibilityLiveRegion="polite">{statusText}</AppText>
      {lastSyncedAt ? (
        <AppText variant="caption" tone="muted">
          {t('sync.lastSync', { time: formatDateTime(lastSyncedAt, language) })}
        </AppText>
      ) : null}
      <AppText variant="caption" tone="muted">
        {t('sync.pending', { count: pending })}
      </AppText>
      {failed > 0 ? (
        <AppText variant="caption" tone="error">
          {t('sync.failed', { count: failed })}
        </AppText>
      ) : null}
      <AppButton variant="secondary" label={t('sync.syncNow')} onPress={syncNow} loading={state === 'syncing'} />
    </AppCard>
  );
}
