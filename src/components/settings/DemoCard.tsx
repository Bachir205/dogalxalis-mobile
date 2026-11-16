import { useState } from 'react';

import { AppButton, AppCard, AppText, confirmAction } from '@/components/ui';
import { useDemoData } from '@/hooks/useDemoData';
import { useI18n } from '@/hooks/useI18n';

/** Settings card: fill the app with clearly marked sample data, or remove it again. */
export function DemoCard() {
  const { t } = useI18n();
  const { counts, isLoaded, busy, load, remove } = useDemoData();
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const run = async (action: typeof load, key: 'demo.justLoaded' | 'demo.justRemoved') => {
    setFailed(false);
    try {
      const result = await action();
      setMessage(t(key, { transactions: result.transactions, budgets: result.budgets }));
    } catch (error) {
      console.warn('Demo data action failed', error);
      setMessage(null);
      setFailed(true);
    }
  };

  const askRemove = () =>
    confirmAction({
      title: t('demo.removeTitle'),
      message: t('demo.removeMessage'),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      onConfirm: () => run(remove, 'demo.justRemoved'),
    });

  return (
    <AppCard>
      <AppText variant="subtitle">{t('demo.title')}</AppText>
      <AppText tone="muted">{t('demo.description')}</AppText>
      {isLoaded ? (
        <AppText variant="caption">
          {t('demo.loaded', { transactions: counts.transactions, budgets: counts.budgets })}
        </AppText>
      ) : null}
      {message ? (
        <AppText variant="caption" tone="muted" accessibilityLiveRegion="polite">
          {message}
        </AppText>
      ) : null}
      {failed ? (
        <AppText variant="caption" tone="error" accessibilityLiveRegion="polite">
          {t('demo.failed')}
        </AppText>
      ) : null}
      {isLoaded ? (
        <AppButton variant="secondary" label={t('demo.remove')} onPress={askRemove} loading={busy} />
      ) : (
        <AppButton label={t('demo.load')} onPress={() => run(load, 'demo.justLoaded')} loading={busy} />
      )}
    </AppCard>
  );
}
