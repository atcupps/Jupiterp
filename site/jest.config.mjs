/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  extensionsToTreatAsEsm: ['.svelte', '.ts'],
  moduleFileExtensions: ['js', 'ts', 'svelte'],
  transform: {
    '^.+\\.svelte$': ['svelte-jester', { preprocess: true }],
    '^.+\\.(ts|js)$': ['ts-jest', { useESM: true, tsconfig: './tsconfig.json' }]
  },
  setupFilesAfterEnv: ['@testing-library/jest-dom']
};

export default config;
