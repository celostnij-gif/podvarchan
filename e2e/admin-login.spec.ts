import { test, expect } from '@playwright/test'

const ADMIN_URL = '/admin'
const LOGIN_URL = '/admin/login'

test.describe('Admin Panel', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto(ADMIN_URL)
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('displays login form', async ({ page }) => {
    await page.goto(LOGIN_URL)
    await expect(page.locator('h1, h2').first()).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto(LOGIN_URL)
    await page.fill('input[type="email"]', 'wrong@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Wait for error message
    await expect(page.locator('text=/неверн|ошибк|error|invalid|fail|not.?found/i')).toBeVisible({ timeout: 10000 })
  })

  test('shows validation errors on empty form', async ({ page }) => {
    await page.goto(LOGIN_URL)
    await page.click('button[type="submit"]')

    // Browser native validation or custom validation should block submission
    await expect(page).toHaveURL(/\/admin\/login/)
  })
})
