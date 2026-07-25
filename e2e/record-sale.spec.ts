import { test, expect } from '@playwright/test'

test.describe('Record Sale', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?e2e=true')
    await expect(page.locator('text=Test Shop')).toBeVisible({ timeout: 15000 })
  })

  test('opens sale form from Add screen', async ({ page }) => {
    // Navigate to Add
    await page.getByRole('button', { name: /ongeza|add/i }).click()
    await expect(page.locator('text=Ongeza Mauzo')).toBeVisible({ timeout: 5000 })

    // Click Mauzo (Sale)
    await page.getByRole('button', { name: /mauzo|sale/i }).first().click()
    await expect(page.locator('text=Kiasi')).toBeVisible({ timeout: 5000 })
  })

  test('can fill and submit a sale', async ({ page }) => {
    await page.getByRole('button', { name: /ongeza|add/i }).click()
    await expect(page.locator('text=Ongeza Mauzo')).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: /mauzo|sale/i }).first().click()
    await expect(page.locator('text=Kiasi')).toBeVisible({ timeout: 5000 })

    // Fill amount
    await page.getByRole('textbox').first().fill('500')

    // Fill description
    await page.getByRole('textbox').nth(1).fill('Test sale E2E')

    // Submit
    await page.getByRole('button', { name: /hifadhi|save/i }).click()

    // Should navigate back to dashboard
    await expect(page.locator('text=Test Shop')).toBeVisible({ timeout: 10000 })
  })
})
