export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js'],
  verbose: true,
  collectCoverage: false,
  testPathIgnorePatterns: ['/node_modules/'],
};
