import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    emptyOutDir: false,
    outDir: 'public',
    lib: {
      entry: path.resolve(__dirname, 'src/review/bridge/main.ts'),
      name: 'AidocReviewBridge',
      formats: ['iife'],
      fileName: () => 'review-bridge.js',
    },
    rollupOptions: {
      output: {
        extend: true,
      },
    },
  },
});
