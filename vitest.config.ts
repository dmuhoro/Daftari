import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals:     true,
    setupFiles:  ['./src/test/setup.ts'],
    exclude:     ['e2e/**', 'e2e-multidevice/**', 'node_modules/**'],
    coverage: {
      provider:   'v8',
      reporter:   ['text', 'json', 'html'],
      include:    ['src/lib/**', 'src/features/**', 'src/screens/**', 'src/components/**'],
      thresholds: {
        lines:      46,
        branches:   27,
        functions:  36,
        statements: 44,
      },
    },
  },
})
