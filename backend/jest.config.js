module.exports = {
  testEnvironment: 'node',
  // Load test environment BEFORE tests run (uses .env.test with test.db)
  setupFiles: ['<rootDir>/tests/loadEnv.js'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  testTimeout: 10000,
};
