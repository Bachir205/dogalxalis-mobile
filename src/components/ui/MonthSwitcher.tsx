import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';
import { formatMonthLabel } from '@/utils/dateFormat';

import { AppText } from './AppText';

interface MonthSwitcherProps {
  /** YYYY-MM */
  month: string;
  onPrevious: () => void;
  onNext: () => void;
}

/** "< November 2026 >" with previous / next buttons. */
export function MonthSwitcher({ month, onPrevious, onNext }: MonthSwitcherProps) {
  const { colors, touchTarget } = useTheme();
  const { t, language } = useI18n();
  const button = { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center' } as const;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Pressable onPress={onPrevious} accessibilityRole="button" accessibilityLabel={t('common.previous')} style={button}>
        <ChevronLeft color={colors.text} size={24} />
      </Pressable>
      <AppText variant="subtitle" accessibilityLiveRegion="polite">
        {formatMonthLabel(month, language)}
      </AppText>
      <Pressable onPress={onNext} accessibilityRole="button" accessibilityLabel={t('common.next')} style={button}>
        <ChevronRight color={colors.text} size={24} />
      </Pressable>
    </View>
  );
}
