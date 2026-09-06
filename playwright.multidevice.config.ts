import { defineConfig, devices } from '@playwright/test'

// TRUE multi-device live-update simulation against the REAL production PWA.
//
// Proves the B1 claim end-to-end: two open clients signed into the SAME account
// — client A records a sale, client B's open History updates IN PLACE via
// postgres_changes (no manual pull, no reload). This is the boundary test the
// unit suite cannot reach: it depends on real time delivery, which only exists
// once daftari_transactions/daftari_businesses are members of the
// supabase_realtime publication on live.
//
// Deliberately gated: run `npm run test:e2e:multidevice` with
// E2E_LIVE_EMAIL / E2E_LIVE_PASSWORD present. Without creds the suite SKIPS.
// Requires the account to already have a business (created during the phone
// onboarding) — the spec fails loudly with that guidance instead of faking it.
export default defineConfig({
  testDir: './e2e-multidevice',
  fullyParallel: false,
  retries: process.env.CI ? 0 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 90000,
  use: {
    baseURL: 'https://daftari-amber.vercel.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
    },
    permissions: ['notifications'],
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})