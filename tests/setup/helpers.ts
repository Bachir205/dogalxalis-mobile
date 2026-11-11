import { act } from '@testing-library/react-native';

/**
 * Lets pending promises and effects (e.g. loading and saving AsyncStorage) finish, inside act().
 * It only awaits promises, never timers, so it also works when fake timers are active
 * (expo-router's test renderer uses them).
 */
export async function flushPromises(): Promise<void> {
  await act(async () => {
    for (let i = 0; i < 50; i++) await Promise.resolve();
  });
}
