import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    environmentMatchGlobs: [
      // Use jsdom for component tests
      ['src/components/**/*.test.tsx', 'jsdom'],
    ],
  },
});
