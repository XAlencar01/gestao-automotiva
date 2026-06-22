module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src/test'],
  testPathIgnorePatterns: ['/node_modules/'],
  setupFiles: ['<rootDir>/src/test/setup.js'],
  collectCoverageFrom: [
    'src/controllers/**/*.js',
    'src/middlewares/**/*.js',
    'src/routes/**/*.js',
  ],
  coverageThreshold: {
    global: {
      statements: 60,
      branches:   50,
      functions:  60,
      lines:      60,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
};