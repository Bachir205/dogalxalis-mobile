import { Settings } from 'lucide-react-native';

import { ShellScreen } from '@/components/ui';
import { useI18n } from '@/hooks/useI18n';

/** Settings tab. Phase 2 shell; theme, language and currency arrive in Phase 3. */
export default function SettingsScreen() {
  const { t } = useI18n();

  return (
    <ShellScreen
      edges={[]}
      icon={Settings}
      title={t('settings.title')}
      message={`${t('settings.message')} ${t('common.comingIn', { phase: 3 })}`}
    />
  );
}
