import tailwindcss from '@tailwindcss/vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

import { talkingHeadLipsyncPlugin } from './vite/talkinghead-lipsync-plugin';

const aliases = {
  '@/components': path.resolve(__dirname, 'src/components'),
  '@/assets': path.resolve(__dirname, 'src/assets'),
  '@/utils': path.resolve(__dirname, 'src/utils'),
  '@/styles': path.resolve(__dirname, 'src/styles'),
  '@/routes': path.resolve(__dirname, 'src/routes'),
  '@/hooks': path.resolve(__dirname, 'src/hooks'),
  '@/stores': path.resolve(__dirname, 'src/stores'),
  '@/types': path.resolve(__dirname, 'src/types'),
  '@/api': path.resolve(__dirname, 'src/api'),
  '@/services': path.resolve(__dirname, 'src/services'),
  '@/config': path.resolve(__dirname, 'src/config'),
  '@/contexts': path.resolve(__dirname, 'src/contexts'),
};

export default defineConfig({
  plugins: [
    TanStackRouterVite({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    talkingHeadLipsyncPlugin(),
  ],
  define: {
    'import.meta.env.VITE_VERCEL_ENV': JSON.stringify(process.env.VERCEL_ENV),
    'import.meta.env.VITE_VERCEL_GIT_COMMIT_REF': JSON.stringify(
      process.env.VERCEL_GIT_COMMIT_REF,
    ),
    'import.meta.env.VITE_VERCEL_GIT_PULL_REQUEST_ID': JSON.stringify(
      process.env.VERCEL_GIT_PULL_REQUEST_ID,
    ),
  },
  resolve: {
    alias: {
      ...aliases,
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    // TalkingHead dynamically imports ./lipsync-*.mjs; pre-bundling breaks those paths.
    exclude: ['@met4citizen/talkinghead'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('@met4citizen/talkinghead')) return 'talkinghead';
        },
      },
    },
  },
  server: {
    port: process.env.VITE_PORT ? parseInt(process.env.VITE_PORT) : 8080,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setupTests.ts',
    css: true,
    exclude: ['tests/', 'node_modules/', 'dist/'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'build/',
        '*.config.ts',
        '*.d.ts',
        'src/main.tsx',
        'src/App.tsx',
        'src/routeTree.gen.ts',
        'src/vite-env.d.ts',
        'eslint.config.js',
        'tests/',
      ],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
});
