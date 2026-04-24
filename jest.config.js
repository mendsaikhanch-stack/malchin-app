/** @type {import('jest').Config} */
// Хоёр project: pure TS тест (ts-jest, node env) + RN component тест (jest-expo).
// Pure test нь бага заргатай ажиллана, component test нь зөвхөн UI-ийнхээ шаардлагаар.

const ASYNC_STORAGE_MOCK =
  '<rootDir>/node_modules/@react-native-async-storage/async-storage/jest/async-storage-mock.js';

module.exports = {
  projects: [
    {
      displayName: 'pure',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/services/__tests__/**/*.test.ts',
        '<rootDir>/hooks/__tests__/**/*.test.ts',
      ],
      setupFiles: ['<rootDir>/jest.setup.pure.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^@react-native-async-storage/async-storage$': ASYNC_STORAGE_MOCK,
      },
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { isolatedModules: true }],
      },
    },
    {
      displayName: 'rn',
      preset: 'jest-expo',
      testMatch: [
        '<rootDir>/components/__tests__/**/*.test.tsx',
        '<rootDir>/app/__tests__/**/*.test.tsx',
        '<rootDir>/hooks/__tests__/**/*.test.tsx',
      ],
      setupFiles: ['<rootDir>/jest.setup.rn.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^@react-native-async-storage/async-storage$': ASYNC_STORAGE_MOCK,
      },
      transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg))',
      ],
    },
  ],
};
