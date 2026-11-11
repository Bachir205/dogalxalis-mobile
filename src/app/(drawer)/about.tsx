import { AppCard, AppText, ScreenContainer } from '@/components/ui';
import { useI18n } from '@/hooks/useI18n';

/** About: real content (static text), available from the drawer. */
export default function AboutScreen() {
  const { t } = useI18n();

  return (
    <ScreenContainer scroll>
      <AppText variant="title">{t('app.name')}</AppText>
      <AppText>{t('about.description')}</AppText>

      <AppCard>
        <AppText variant="subtitle">{t('about.purposeTitle')}</AppText>
        <AppText>{t('about.purpose')}</AppText>
      </AppCard>

      <AppCard>
        <AppText variant="subtitle">{t('about.technologiesTitle')}</AppText>
        <AppText>{t('about.technologies')}</AppText>
      </AppCard>

      <AppCard>
        <AppText variant="subtitle">{t('about.authorTitle')}</AppText>
        <AppText>{t('about.author')}</AppText>
      </AppCard>
    </ScreenContainer>
  );
}
