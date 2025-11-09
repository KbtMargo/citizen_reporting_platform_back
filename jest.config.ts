// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: [
    '<rootDir>/test/unit/**/*.spec.ts',
    '<rootDir>/test/feature/**/*.e2e-spec.ts',
    '<rootDir>/test/feature/**/*.spec.ts',
  ],
  testPathIgnorePatterns: ['<rootDir>/src/.*\\.spec\\.ts$'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: { '^src/(.*)$': '<rootDir>/src/$1' },
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
export default config;
