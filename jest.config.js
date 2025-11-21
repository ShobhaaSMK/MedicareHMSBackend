module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setupTestDB.js'],
  testMatch: ['**/tests/**/*.test.js'],
};

