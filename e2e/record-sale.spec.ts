import { test, expect } from '@playwright/test'

test.describe('Record Sale', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => { Object.assign(window, { __E2E__: true }) })
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

    const amountInput = page.locator('[inputmode="decimal"]')
    const descriptionInput = page.getByPlaceholder(/Maelezo|Description/i)

    await amountInput.fill('500')
    await descriptionInput.fill('Test sale E2E')

    await page.getByRole('button', { name: /hifadhi|save/i }).click()

    // Dismiss the receipt overlay
    await page.getByRole('button', { name: /funga|close/i }).click()

    await expect(page.locator('text=Test Shop')).toBeVisible({ timeout: 10000 })
  })
})
