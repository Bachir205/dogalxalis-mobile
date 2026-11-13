import { CircleAlert, CircleCheck, OctagonAlert, TriangleAlert, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText } from '@/components/ui';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';
import type { BudgetStatus } from '@/utils/budgetCalculations';

const ICONS: Record<BudgetStatus, LucideIcon> = {
  normal: CircleCheck,
  approaching: TriangleAlert,
  reached: CircleAlert,
  exceeded: OctagonAlert,
};

/** Color, icon and translated label of a status. Color is never the only signal. */
export function useBudgetStatusStyle(status: BudgetStatus) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const colorFor: Record<BudgetStatus, string> = {
    normal: colors.success,
    approaching: colors.budgetWarning,
    reached: colors.budgetWarning,
    exceeded: colors.budgetExceeded,
  };
  return { color: colorFor[status], Icon: ICONS[status], label: t(`budgets.status.${status}`) };
}

export function BudgetStatusBadge({ status }: { status: BudgetStatus }) {
  const { spacing } = useTheme();
  const { color, Icon, label } = useBudgetStatusStyle(status);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
      <Icon color={color} size={16} />
      <AppText variant="caption" style={{ color, fontWeight: '700' }}>
        {label}
      </AppText>
    </View>
  );
}
