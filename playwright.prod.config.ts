import { defineConfig, devices } from '@playwright/test'

// PRODUCTION-BUILD specs: prove installability + offline behavior against the shipped `vite build`
// output (SW registered, PNG manifest served, app shell + IndexedDB work offline), served via
// `vite preview`. This is the real boundary — the dev-mode suite explicitly has no SW.
export default defineConfig({
  testDir: './e2e',
  testMatch: /.*prod\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 45000,
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})