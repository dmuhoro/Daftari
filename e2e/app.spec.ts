import { test, expect } from '@playwright/test'

test.describe('App loads', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('[PAGE]', msg.type(), msg.text()))
    page.on('pageerror', err => console.log('[PAGE ERROR]', err.message))
    await page.addInitScript(() => { (window as any).__E2E__ = true })
  })

  test('shows dashboard with test data in E2E mode', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Test Shop')).toBeVisible({ timeout: 15000 })
  })

  test('displays today profit/loss card', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Test Shop')).toBeVisible({ timeout: 15000 })
    await expect(page.locator('text=Faida')).toBeVisible({ timeout: 5000 })
  })
})
