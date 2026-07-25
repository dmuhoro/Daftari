import { test, expect } from '@playwright/test'

test.describe('PWA basics', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => { Object.assign(window, { __E2E__: true }) })
    await page.goto('/')
    await expect(page.locator('text=Test Shop')).toBeVisible({ timeout: 15000 })
  })

  test('app shell renders correctly', async ({ page }) => {
    await expect(page.locator('nav')).toBeVisible()
  })

  test('service worker not registered (dev mode)', async ({ page }) => {
    const swRegistered = await page.evaluate(() =>
      navigator.serviceWorker?.getRegistration().then(r => !!r)
    )
    expect(swRegistered).toBe(false)
  })

  test('IndexedDB is accessible', async ({ page }) => {
    const dbExists = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        const req = indexedDB.databases?.() ?? Promise.resolve([])
        req.then(dbs => resolve(dbs.some(d => d.name === 'DaftariDB'))).catch(() => resolve(false))
      })
    })
    expect(dbExists).toBe(true)
  })
})
