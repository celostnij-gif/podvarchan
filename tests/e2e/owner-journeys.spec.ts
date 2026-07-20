import { test, expect } from '@playwright/test'

/**
 * J1-J3 Owner Journey smoke tests.
 *
 * These tests verify the core CMS cycles:
 * - J1: Create + publish a service → visible on public
 * - J2: Create a blog category → visible on public
 * - J3: Create + publish a blog post → visible on public
 *
 * Requirements:
 * - Admin running at ADMIN_URL (default https://admin.podvarchan.com)
 * - Public running at PUBLIC_URL (default https://podvarchan.com)
 * - OWNER credentials in env: OWNER_EMAIL, OWNER_PASSWORD
 *
 * Run:
 *   OWNER_EMAIL=... OWNER_PASSWORD=... npx playwright test tests/e2e/owner-journeys.spec.ts
 */

const ADMIN_URL = process.env.ADMIN_URL || 'https://admin.podvarchan.com'
const PUBLIC_URL = process.env.PUBLIC_URL || 'https://podvarchan.com'
const EMAIL = process.env.OWNER_EMAIL || ''
const PASSWORD = process.env.OWNER_PASSWORD || ''

test.skip(!EMAIL || !PASSWORD, 'OWNER_EMAIL and OWNER_PASSWORD env vars required')

test.describe('Owner Journeys J1-J3', () => {
  test.beforeEach(async ({ page }) => {
    // Login as OWNER
    await page.goto(`${ADMIN_URL}/admin/login`)
    await page.fill('input[type="email"]', EMAIL)
    await page.fill('input[type="password"]', PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin**', { timeout: 15000 })
  })

  test('J1: create draft service → publish → visible on public', async ({ page, context }) => {
    const slug = `test-service-${Date.now()}`
    const titleRu = `Тестовая услуга ${Date.now()}`

    // 1. Go to new service form
    await page.goto(`${ADMIN_URL}/admin/services/new`)
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 })

    // 2. Fill RU title (slug should auto-derive)
    await page.fill('input[name="ru_title"]', titleRu)
    await page.fill('textarea[name="ru_excerpt"]', 'Тестовое описание услуги')

    // 3. Save as draft
    await page.click('button:has-text("Зберегти чернетку")')
    await page.waitForURL('**/admin/services/**', { timeout: 10000 })

    // 4. Publish
    await page.click('button:has-text("Опублікувати")')
    await page.waitForURL('**/admin/services/**', { timeout: 10000 })

    // 5. Verify on public site (within 30s)
    const publicPage = await context.newPage()
    await publicPage.goto(`${PUBLIC_URL}/ru/uslugi/`, { timeout: 30000 })
    await expect(publicPage.locator(`text=${titleRu}`)).toBeVisible({ timeout: 30000 })
    await publicPage.close()
  })

  test('J2: create blog category', async ({ page }) => {
    const catName = `Тестовая категория ${Date.now()}`

    // 1. Go to new category form
    await page.goto(`${ADMIN_URL}/admin/blog/categories/new`)
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 })

    // 2. Fill name (slug should auto-derive)
    await page.fill('input[name="ru_name"]', catName)

    // 3. Save
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin/blog/categories**', { timeout: 10000 })

    // 4. Verify category appears in list
    await expect(page.locator(`text=${catName}`)).toBeVisible({ timeout: 5000 })
  })

  test('J3: create draft blog post → publish → visible on public', async ({ page, context }) => {
    const titleRu = `Тестовая статья ${Date.now()}`

    // 1. Go to new post form
    await page.goto(`${ADMIN_URL}/admin/blog/posts/new`)
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 })

    // 2. Fill required fields
    await page.fill('input[name="ru_title"]', titleRu)
    await page.fill('textarea[name="ru_excerpt"]', 'Тестовое описание статьи')

    // 3. Select first category if available
    const categorySelect = page.locator('select[name="categoryId"]')
    const firstOption = await categorySelect.locator('option').nth(1).textContent()
    if (firstOption && firstOption !== '—') {
      await categorySelect.selectOption({ index: 1 })
    }

    // 4. Save as draft
    await page.click('button:has-text("Зберегти чернетку")')
    await page.waitForURL('**/admin/blog/posts/**', { timeout: 10000 })

    // 5. Publish
    await page.click('button:has-text("Опублікувати")')
    await page.waitForURL('**/admin/blog/posts/**', { timeout: 10000 })

    // 6. Verify on public site (within 30s)
    const publicPage = await context.newPage()
    await publicPage.goto(`${PUBLIC_URL}/ru/blog/`, { timeout: 30000 })
    await expect(publicPage.locator(`text=${titleRu}`)).toBeVisible({ timeout: 30000 })
    await publicPage.close()
  })
})
