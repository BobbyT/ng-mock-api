/// <reference types="vitest" />

import angular from '@analogjs/vite-plugin-angular';
import viteTsConfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [
      angular(),
      viteTsConfigPaths()
    ],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['src/test-setup.ts'],
      include: ['**/*.spec.ts'],
      reporters: ['default'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov', 'json'],
        reportsDirectory: 'coverage'
      }
    },
    define: {
      'import.meta.vitest': mode !== 'production',
    },
  };
});
