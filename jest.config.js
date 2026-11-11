/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Jest cannot load the ESM build of lucide-react-native, so use its CommonJS build.
    '^lucide-react-native$': '<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js',
  },
  // The first run after install compiles many files, which can exceed Jest's default 5 s.
  testTimeout: 60000,
  testMatch: ['<rootDir>/tests/**/*.test.ts?(x)'],
  // [\\/] accepts both / and \ so the pattern also works on Windows paths.
  transformIgnorePatterns: [
    'node_modules[\\\\/](?!(jest-)?(react-native|@react-native|expo|@expo|react-navigation|@react-navigation|standard-navigation|lucide-react-native|test-renderer|@testing-library))',
  ],
};