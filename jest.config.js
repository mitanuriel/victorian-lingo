/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-native',
        },
      },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@theme$': '<rootDir>/src/theme/index',
    '^@models$': '<rootDir>/src/models/index',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@store/(.*)$': '<rootDir>/src/store/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    // Stub React Native modules that don't exist in Node test env
    'expo-sqlite': '<rootDir>/src/__mocks__/expo-sqlite.ts',
    'expo-file-system': '<rootDir>/src/__mocks__/expo-file-system.ts',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?expo|@expo|expo-router|expo-sqlite|expo-file-system|react-native|@react-native|@react-navigation)',
  ],
  setupFilesAfterFramework: [],
  passWithNoTests: true,
};
