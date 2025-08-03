// Simplified Jest configuration for troubleshooting
module.exports = {
  testEnvironment: 'node',
  maxWorkers: 1,
  forceExit: true,
  setupFiles: ['<rootDir>/jest.env.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '<rootDir>/__tests__/**/*.{js,ts}',
  ],
  collectCoverageFrom: [
    'lib/**/*.{js,ts}',
    '!lib/**/*.d.ts',
  ],
}