import { defineConfig } from 'vitest/config';

// Relative base so the build works from any sub-path (e.g. user.github.io/tidy-up/).
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // three.js changes far less often than the game code, so keep it in its own cacheable file.
        manualChunks: (id) => (id.includes('node_modules/three') ? 'three' : undefined),
      },
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
