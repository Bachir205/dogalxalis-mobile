import { AppCard, AppText } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';

interface SummaryCardProps {
  label: string;
  value: string;
  tone?: 'default' | 'income' | 'expense';
}

/** A label and one big number (income, expenses, net). */
export function SummaryCard({ label, value, tone = 'default' }: SummaryCardProps) {
  const { colors } = useTheme();
  const color = tone === 'income' ? colors.income : tone === 'expense' ? colors.expense : colors.text;
  return (
    <AppCard style={{ flex: 1 }}>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      <AppText variant="subtitle" style={{ color }} accessibilityLabel={`${label}: ${value}`}>
        {value}
      </AppText>
    </AppCard>
  );
}
