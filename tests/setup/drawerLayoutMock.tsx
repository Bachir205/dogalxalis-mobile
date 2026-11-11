/**
 * Test double for react-native-drawer-layout.
 *
 * The real drawer animates with Reanimated worklets and native gestures, which cannot run in
 * Jest. This stub renders the drawer menu and the screen side by side, so the tests can check
 * the routes, the menu items and the navigation. Swipe gestures and the slide animation are
 * native behaviour and are verified on the physical device.
 */
import { createContext, type ReactNode } from 'react';
import { View } from 'react-native';

interface StubDrawerProps {
  renderDrawerContent: () => ReactNode;
  children: ReactNode;
}

export const Drawer = ({ renderDrawerContent, children }: StubDrawerProps) => (
  <View>
    {renderDrawerContent()}
    {children}
  </View>
);

export const DrawerGestureContext = createContext<unknown>(undefined);
export const DrawerProgressContext = createContext<unknown>(undefined);
export const useDrawerProgress = () => ({ value: 0 });
