import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => { (window as any).__E2E__ = true })
    await page.goto('/')
    await expect(page.locator('text=Test Shop')).toBeVisible({ timeout: 15000 })
  })

  test('navigates to Add screen', async ({ page }) => {
    await page.getByRole('button', { name: /ongeza|add/i }).click()
    await expect(page.locator('text=Ongeza Mauzo')).toBeVisible({ timeout: 5000 })
  })

  test('navigates to History screen', async ({ page }) => {
    await page.getByRole('button', { name: /historia|history/i }).click()
    await expect(page.locator('text=Historia')).toBeVisible({ timeout: 5000 })
  })

  test('navigates to Settings screen', async ({ page }) => {
    await page.getByRole('button', { name: /mipangilio|settings/i }).click()
    await expect(page.locator('text=Mipangilio')).toBeVisible({ timeout: 5000 })
  })
})
