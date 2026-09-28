module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/unit'],
  collectCoverageFrom: ['app/src/**/*.js', '!app/src/server.js'],
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: { lines: 80, statements: 80, functions: 80, branches: 80 },
  },
};
