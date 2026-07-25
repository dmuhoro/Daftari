import { test, expect } from '@playwright/test'

test.describe('Record Sale', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => { (window as any).__E2E__ = true })
    await page.goto('/')
    await expect(page.locator('text=Test Shop')).toBeVisible({ timeout: 15000 })
  })

  test('opens sale form from Add screen', async ({ page }) => {
    await page.getByRole('button', { name: /ongeza|add/i }).click()
    await expect(page.locator('text=Ongeza Mauzo')).toBeVisible({ timeout: 5000 })

    await page.getByRole('button', { name: /mauzo|sale/i }).first().click()
    await expect(page.locator('text=Kiasi')).toBeVisible({ timeout: 5000 })
  })

  test('can fill and submit a sale', async ({ page }) => {
    await page.getByRole('button', { name: /ongeza|add/i }).click()
    await expect(page.locator('text=Ongeza Mauzo')).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: /mauzo|sale/i }).first().click()
    await expect(page.locator('text=Kiasi')).toBeVisible({ timeout: 5000 })

    await page.getByRole('textbox').first().fill('500')
    await page.getByRole('textbox').nth(1).fill('Test sale E2E')

    await page.getByRole('button', { name: /hifadhi|save/i }).click()

    await expect(page.locator('text=Test Shop')).toBeVisible({ timeout: 10000 })
  })
})
