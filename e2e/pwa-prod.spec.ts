import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

// Production-build verification of the installability + offline-first claims.
// Against `vite build` output (SW registered, PNG manifest), not dev mode.
//
// SW life-cycle fact the spec respects: the very FIRST visit installs the service
// worker but the page is NOT yet controlled by it; control begins on the NEXT
// navigation. So each flow first reaches a "controlled" state online, and only
// then tests the offline paths — this mirrors a real user's 2nd+ launch.

async function gotoApp(page: Page) {
  // `e2e=true` triggers the runtime data seed (same gate main.tsx uses)
  await page.goto('/?e2e=true')
  await expect(page.locator('text=Test Shop')).toBeVisible({ timeout: 20000 })
}

async function waitForRegistration(page: Page) {
  await expect
    .poll(async () => page.evaluate(() => navigator.serviceWorker?.getRegistration().then(r => !!r)), {
      timeout: 15000,
      message: 'service worker should register in the production build',
    })
    .toBe(true)
}

async function reachControlled(page: Page) {
  await gotoApp(page)
  await waitForRegistration(page)
  // SW activated — force a controlled second load (online).
  await page.reload()
  await expect(page.locator('text=Test Shop')).toBeVisible({ timeout: 15000 })
  await expect
    .poll(async () => page.evaluate(() => navigator.serviceWorker?.controller !== null), {
      timeout: 10000,
      message: 'service worker should control the page after first activation',
    })
    .toBe(true)
}

test.describe('Installability (production build)', () => {
  test('manifest requires PNG icons (192 + 512) — the Android Chrome installability fix', async ({ page }) => {
    await reachControlled(page)
    const manifest = await page.evaluate(async () => {
      const res = await fetch('/manifest.webmanifest')
      return res.json()
    })
    const icons = (manifest.icons ?? []) as Array<{
      src: string
      sizes: string
      type: string
      purpose?: string
    }>
    expect(icons.every(i => i.type === 'image/png')).toBe(true)
    expect(icons.map(i => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']))
    expect(icons.some(i => i.purpose === 'maskable' && i.sizes === '512x512')).toBe(true)
    expect(manifest.display).toBe('standalone')
    expect(manifest.start_url).toBe('/')
  })

  test('apple-touch-icon (180px) is linked in the document head for iOS', async ({ page }) => {
    await reachControlled(page)
    const href = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href')
    expect(href).toMatch(/\.png$/)
    const status = await page.evaluate(async (h) => {
      const res = await fetch(h as string)
      return res.status
    }, href)
    expect(status).toBe(200)
  })

  test('service worker is registered and controls the page in production', async ({ page }) => {
    await reachControlled(page)
    expect(await page.evaluate(() => navigator.serviceWorker?.controller !== null)).toBe(true)
  })
})

test.describe('Offline behavior (production build)', () => {
  test('app shell survives a full offline reload — no crash, IndexedDB data intact', async ({ page, context }) => {
    await reachControlled(page)
    await context.setOffline(true)
    await page.reload()
    await expect(page.locator('text=Test Shop')).toBeVisible({ timeout: 15000 })
    await expect(page.locator('text=/Huna mtandao — data imehifadhiwa|No internet — data saved locally/')).toBeVisible({ timeout: 5000 })
  })

  test('an offline-recorded sale is persisted locally (synced=0) and never silently dropped', async ({ page, context }) => {
    await reachControlled(page)
    await context.setOffline(true)

    await page.getByRole('button', { name: /ongeza|add/i }).click()
    await expect(page.locator('text=Ongeza Mauzo')).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: /mauzo|sale/i }).first().click()
    await expect(page.locator('text=Kiasi')).toBeVisible({ timeout: 5000 })

    await page.locator('[inputmode="decimal"]').fill('400')
    await page.getByPlaceholder(/Maelezo|Description/i).fill('Offline sale E2E')
    await page.getByRole('button', { name: /hifadhi|save/i }).click()
    await page.getByRole('button', { name: /funga|close/i }).click()

    // No-silent-drop: the record lives in IndexedDB, marked pending-sync (synced=0)
    const synced0Count = await page.evaluate(async () => {
      const req = indexedDB.open('DaftariDB')
      return await new Promise<number>((resolve) => {
        req.onsuccess = () => {
          const db = req.result
          const tx = db.transaction('transactions', 'readonly').objectStore('transactions')
          const req2 = tx.index('synced').getAll(0)
          req2.onsuccess = () => resolve(req2.result.filter(r => r.description === 'Offline sale E2E').length)
          req2.onerror = () => resolve(0)
        }
        req.onerror = () => resolve(0)
      })
    })
    expect(synced0Count).toBe(1)

    // Still there after an offline reload (a failed sync must never drop it)
    await page.reload()
    await expect(page.locator('text=/Huna mtandao — data imehifadhiwa|No internet — data saved locally/')).toBeVisible({ timeout: 15000 })
    const stillThere = await page.evaluate(async () => {
      const req = indexedDB.open('DaftariDB')
      return await new Promise<number>((resolve) => {
        req.onsuccess = () => {
          const db = req.result
          const tx = db.transaction('transactions', 'readonly').objectStore('transactions')
          const req2 = tx.index('synced').getAll(0)
          req2.onsuccess = () => resolve(req2.result.filter(r => r.description === 'Offline sale E2E').length)
          req2.onerror = () => resolve(0)
        }
        req.onerror = () => resolve(0)
      })
    })
    expect(stillThere).toBe(1)
  })
})