import { test, expect } from '@playwright/test'

test.describe('App loads', () => {
  test('shows dashboard with test data in E2E mode', async ({ page }) => {
    await page.goto('/?e2e=true')
    // Wait for the dashboard to render (AppShell with test business)
    await expect(page.locator('text=Test Shop')).toBeVisible({ timeout: 15000 })
  })

  test('displays today profit/loss card', async ({ page }) => {
    await page.goto('/?e2e=true')
    await expect(page.locator('text=Test Shop')).toBeVisible({ timeout: 15000 })
    // The dashboard shows a profit/loss hero card with KES
    await expect(page.locator('text=Faida')).toBeVisible({ timeout: 5000 })
  })
})
