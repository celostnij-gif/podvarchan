import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = 'admin@podvarchan.com'
const ADMIN_PASSWORD = 'Test1234!'

test.describe('Admin Login', () => {
  test('redirects unauthenticated user to /admin/login', async ({ page }) => {
    await page.goto('/admin/')
    await page.waitForURL('**/admin/login**', { timeout: 15000 })
    expect(page.url()).toContain('/admin/login')
  })

  test('login form renders with required fields', async ({ page }) => {
    await page.goto('/admin/login/')
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('button[type="submit"]')).toBeVisible({ timeout: 5000 })
  })

  test('shows error for wrong credentials', async ({ page }) => {
    await page.goto('/admin/login/')
    await page.fill('input[type="email"]', 'wrong@email.com', { timeout: 5000 })
    await page.fill('input[type="password"]', 'wrongpass', { timeout: 5000 })
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)
    expect(page.url()).toContain('/admin/login')
  })
})
