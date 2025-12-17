import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: {
      'describe': 'vi',
      'it': 'vi',
      'expect': 'vi'
    },
    include: [
      'src/**/*.{test,spec}.{js,ts,vue}',
      'tests/**/*.{test,spec}.{js,ts,vue}'
    ],
    exclude: [
      'node_modules',
      'dist',
      '.output',
      '.nuxt'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/main.ts',
        'src/**/*.d.ts',
        'src/**/index.ts'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    testMatch: [
      '<root>/src/**/__tests__/**/*.{test,spec}.{js,ts,vue}',
      '<root>/tests/**/*.{test,spec}.{js,ts,vue}'
    ],
    testTimeout: 30000,
    setupFiles: ['<root>/tests/setup.ts'],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '~': resolve(__dirname, './src'),
        '@@': resolve(__dirname, './src')
      }
    }
  }
})