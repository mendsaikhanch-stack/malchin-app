/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // React Native runtime-д эргэлдүүлэхгүй — зөвхөн pure TS logic-ийн тест.
  // UI/hook test-д дараагийн алхамд jest-expo preset нэмж болно.
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { isolatedModules: true }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  // React import хийгдсэн modules test-д орох магадлалтай — jsx-ийг skip хийхгүй.
};
