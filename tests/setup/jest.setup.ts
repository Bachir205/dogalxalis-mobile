import AsyncStorage from '@react-native-async-storage/async-storage';

import { resetDatabaseConnection } from '@/database/database';

import { resetSqliteMock } from './sqliteMock';

// In-memory AsyncStorage (the real one needs the phone).
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// SQLite: real SQL on a pure-JavaScript engine (see tests/setup/sqlJsDatabase.ts).
jest.mock('expo-sqlite', () => require('./sqliteMock'));

// The real drawer animates with native worklets: swap it for a plain stub (see the stub's header).
jest.mock('react-native-drawer-layout', () => require('./drawerLayoutMock'));

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

// Every test starts with empty preferences and a brand-new database.
beforeEach(async () => {
  await AsyncStorage.clear();
  resetSqliteMock();
  resetDatabaseConnection();
});
