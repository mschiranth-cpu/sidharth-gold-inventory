/**
 * ============================================
 * VITEST CONFIGURATION
 * ============================================
 * 
 * Test configuration for React components using
 * Vitest with jsdom environment.
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  test: {
    // Use jsdom environment for DOM testing
    environment: 'jsdom',
    
    // Global test setup file
    setupFiles: ['./src/__tests__/setup.ts'],
    
    // Include test files
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    
    // Exclude files
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    
    // Enable global test APIs (describe, it, expect, etc.)
    globals: true,
    
    // CSS handling
    css: true,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/__tests__/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
    
    // Reporter configuration
    reporters: ['verbose'],
    
    // Timeout for tests
    testTimeout: 10000,
    
    // Watch mode
    watch: false,
  },
  
  // Path aliases (same as main vite.config.ts)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
});
