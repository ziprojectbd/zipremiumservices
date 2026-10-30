import { defineConfig } from 'vitest/config';
import path from 'node:path';

const root = path.resolve(__dirname);

export default defineConfig({
  root,
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
    testTimeout: 15_000,
    hookTimeout: 15_000,
  },
  resolve: {
    alias: {
      '@': path.resolve(root, 'src'),
      '@db': path.resolve(root, 'src/db'),
      '@controllers': path.resolve(root, 'src/controllers'),
      '@services': path.resolve(root, 'src/services'),
      '@models': path.resolve(root, 'src/models'),
      '@routes': path.resolve(root, 'src/routes'),
      '@middlewares': path.resolve(root, 'src/middleware'),
      '@utils': path.resolve(root, 'src/utils'),
      '@config': path.resolve(root, 'src/config'),
      '@types': path.resolve(root, 'src/types'),
      '@interfaces': path.resolve(root, 'src/interfaces'),
      '@docs': path.resolve(root, 'src/docs'),
      '@jobs': path.resolve(root, 'src/jobs'),
      '@repositories': path.resolve(root, 'src/repositories'),
      '@socket': path.resolve(root, 'src/socket'),
    },
  },
});
