import { test, expect } from '@playwright/test'

test.describe('PWA basics', () => {
  test('app shell renders correctly', async ({ page }) => {
    await page.goto('/?e2e=true')
    await expect(page.locator('text=Test Shop')).toBeVisible({ timeout: 15000 })
    // Bottom nav should be visible
    await expect(page.locator('nav')).toBeVisible()
  })

  test('service worker is registered', async ({ page }) => {
    await page.goto('/?e2e=true')
    await expect(page.locator('text=Test Shop')).toBeVisible({ timeout: 15000 })
    const swRegistered = await page.evaluate(() =>
      navigator.serviceWorker?.getRegistration().then(r => !!r)
    )
    expect(swRegistered).toBe(true)
  })

  test('IndexedDB is accessible', async ({ page }) => {
    await page.goto('/?e2e=true')
    await expect(page.locator('text=Test Shop')).toBeVisible({ timeout: 15000 })
    const dbExists = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        const req = indexedDB.databases?.() ?? Promise.resolve([])
        req.then(dbs => resolve(dbs.some(d => d.name === 'DaftariDB'))).catch(() => resolve(false))
      })
    })
    expect(dbExists).toBe(true)
  })
})
