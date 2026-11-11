import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import type { Edge } from 'react-native-safe-area-context';

import { AppButton } from './AppButton';
import { EmptyState } from './EmptyState';
import { FloatingActionButton } from './FloatingActionButton';
import { ScreenContainer } from './ScreenContainer';

interface ShellScreenProps {
  icon: LucideIcon;
  title: string;
  message: string;
  edges?: Edge[];
  actions?: { label: string; onPress: () => void }[];
  fab?: { icon: LucideIcon; label: string; onPress: () => void };
  children?: ReactNode;
}

/**
 * Temporary body for screens whose real content arrives in a later phase.
 * It keeps every route reachable and testable while the navigation is built.
 */
export function ShellScreen({
  icon,
  title,
  message,
  edges,
  actions = [],
  fab,
  children,
}: ShellScreenProps) {
  return (
    <ScreenContainer edges={edges}>
      <EmptyState icon={icon} title={title} message={message} />
      {actions.map((action) => (
        <AppButton
          key={action.label}
          variant="secondary"
          label={action.label}
          onPress={action.onPress}
        />
      ))}
      {children}
      {fab ? <FloatingActionButton {...fab} /> : null}
    </ScreenContainer>
  );
}
