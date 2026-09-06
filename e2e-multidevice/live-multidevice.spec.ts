import { test, expect, type Page, type BrowserContext } from '@playwright/test'
import { randomUUID } from 'node:crypto'

// Gate: real E2E account credentials. Without them the full simulation is skipped.
const EMAIL = process.env.E2E_LIVE_EMAIL
const PASSWORD = process.env.E2E_LIVE_PASSWORD

if (!EMAIL || !PASSWORD) {
  test.describe.skip('live-multidevice', () => {
    test('requires E2E_LIVE_EMAIL / E2E_LIVE_PASSWORD', () => { expect(EMAIL, 'set both env vars to run the live multi-device simulation').toBeTruthy() })
  })
} else {
  test.describe('live multi-device realtime', () => {
    const saleDescription = `RT-SIM-${randomUUID().slice(0, 8)}`

    async function completeSignIn(page: Page) {
      await page.goto('/')
      // Landing (no session) or AuthScreen (session present but unauthenticated shell)
      await page.getByRole('button', { name: /sign in|ingia/i }).first().click({ timeout: 15000 }).catch(() => {
        /* already past landing */
      })
      await page.locator('input[placeholder="you@example.com"]').fill(EMAIL!)
      await page.locator('input[type="password"]').fill(PASSWORD!)
      await page.getByRole('button', { name: /hifadhi|save/i }).click()
    }

    async function loadBusinessDashboard(page: Page, ctx: BrowserContext, label: string) {
      await completeSignIn(page)
      // Wait for either the actual shell (business present) or onboarding (no business yet).
      const onboarding = page.getByText(/welcome to daftari|karibu daftari/i)
      const shell = page.getByRole('button', { name: /settings|mipangilio/i })
      try {
        await shell.waitFor({ timeout: 25000 })
      } catch {
        if (await onboarding.isVisible().catch(() => false)) {
          test.fail(true, `${label}: account has NO business yet — complete onboarding once on the PHONE, then re-run.`)
        }
        throw new Error(`${label}: shell did not load after sign-in`)
      }
      void ctx
    }

    test('sale recorded on device A appears in-place on device B (same account, no reload)', async ({ browser }) => {
      const ctxB = await browser.newContext()
      const ctxA = await browser.newContext()
      const pageB = await ctxB.newPage()
      const pageA = await ctxA.newPage()

      // 1. Both clients signed into the SAME account.
      await loadBusinessDashboard(pageB, ctxB, 'device B')
      await loadBusinessDashboard(pageA, ctxA, 'device A')

      // 2. Device B parks on History with a boot marker to prove no reload occurs.
      await pageB.getByRole('button', { name: /history|historia/i }).click()
      await pageB.getByText(/no transactions yet|hakuna miamala bado/i).isVisible().catch(() => undefined)
      await pageB.evaluate(() => { (window as unknown as Record<string, number>).__bootMarker = Date.now() })

      // 3. Device A records a sale.
      await pageA.getByRole('button', { name: /ongeza|add/i }).click()
      await expect(pageA.getByText(/ongeza mauzo/i)).toBeVisible({ timeout: 5000 })
      await pageA.getByRole('button', { name: /mauzo|sale/i }).first().click()
      await expect(pageA.getByText(/kiasi/i)).toBeVisible({ timeout: 5000 })
      await pageA.locator('[inputmode="decimal"]').fill('250')
      await pageA.getByPlaceholder(/maelezo|description/i).fill(saleDescription)
      await pageA.getByRole('button', { name: /hifadhi|save/i }).click()

      // 4. Device B sees the new sale ARRIVE — in place, without a single reload.
      await expect(pageB.getByText(saleDescription)).toBeVisible({ timeout: 30000 })

      // 5. Proof B never reloaded: the JS-global boot marker survived (a reload clears it).
      const markerSurvived = await pageB.evaluate(() => (window as unknown as Record<string, number>).__bootMarker !== undefined)
      expect(markerSurvived).toBe(true)
      expect(pageB.url()).toContain('daftari-amber.vercel.app')

      await ctxA.close()
      await ctxB.close()
    }, { timeout: 120000 })
  })
}