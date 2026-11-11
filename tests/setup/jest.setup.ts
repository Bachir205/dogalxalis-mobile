import AsyncStorage from '@react-native-async-storage/async-storage';

// In-memory AsyncStorage (the real one needs the phone).
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Native splash screen calls become no-ops.
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve(true)),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

// Predictable ids: test-id-1, test-id-2, ...
let mockIdCounter = 0;
jest.mock('expo-crypto', () => ({ randomUUID: () => `test-id-${++mockIdCounter}` }));

// Tests do not depend on the machine's language.
jest.mock('@/i18n/device', () => ({ detectDeviceLanguage: () => 'en' }));

// Every test starts with empty storage.
beforeEach(async () => {
  await AsyncStorage.clear();
});
