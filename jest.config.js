module.exports = {
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  collectCoverage: true,
  testPathIgnorePatterns: ['node_modules', 'dist'],
  coverageDirectory: './coverage',
  coverageReporters: ['cobertura', 'html', 'lcov'],
};
