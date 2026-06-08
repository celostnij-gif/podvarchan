import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'TEMP', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: [
        'src/lib/schema/**/*.ts',
        'src/lib/seo/**/*.ts',
        'src/lib/auth/**/*.ts',
        'src/lib/actions/result.ts',
        'src/lib/rateLimit.ts',
      ],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.d.ts',
        'src/**/index.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
