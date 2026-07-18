import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Don't auto-load .env — tests must not depend on sync being configured.
    env: {},
  },
});
