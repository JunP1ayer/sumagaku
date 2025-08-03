// Minimal Jest configuration without Next.js wrapper
module.exports = {
  testEnvironment: 'node',
  
  // Basic TypeScript support
  preset: 'ts-jest',
  
  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  
  // Test files
  testMatch: [
    '<rootDir>/__tests__/**/*.test.ts',
  ],
  
  // Setup
  setupFiles: ['<rootDir>/jest.env.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Performance
  maxWorkers: 1,
  forceExit: true,
  
  // Transform
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
  ],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],
}