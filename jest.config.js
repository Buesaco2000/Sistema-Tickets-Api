/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/integration/**/*.test.js'],
  setupFilesAfterFramework: [],
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.js'],
  testTimeout: 15000,
};
