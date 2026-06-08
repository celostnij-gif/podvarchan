import { test, expect } from '@playwright/test'

const PUBLIC_PAGES = [
  { url: '/', title: /Podvarchan|гипнотерапия/i },
  { url: '/ru/', title: /Podvarchan|гипнотерапия/i },
  { url: '/uk/', title: /Podvarchan|гiпнотерапiя/i },
  { url: '/ru/uslugi/', title: /услуг|послуг/i },
  { url: '/uk/uslugi/', title: /послуг/i },
  { url: '/ru/ob-avtore/', title: /автор/i },
  { url: '/ru/metod/', title: /метод/i },
  { url: '/ru/blog/', title: /блог|стат/i },
  { url: '/ru/faq/', title: /faq|вопрос|питан/i },
  { url: '/ru/kontakty/', title: /контакт/i },
  { url: '/ru/tseny/', title: /цен|цiн/i },
]

test.describe('Public Pages', () => {
  for (const { url, title } of PUBLIC_PAGES) {
    test(`loads ${url} with correct title`, async ({ page }) => {
      const response = await page.goto(url)
      expect(response?.status()).toBeLessThan(400)
      await expect(page).toHaveTitle(title)
    })
  }

  test('all public pages have valid HTML structure', async ({ page }) => {
    const urls = ['/ru/', '/ru/uslugi/', '/ru/ob-avtore/', '/ru/blog/', '/ru/faq/', '/ru/kontakty/']
    for (const url of urls) {
      await page.goto(url)
      // Check basic HTML structure
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator('main')).toBeVisible()
      await expect(page.locator('footer')).toBeVisible()
    }
  })
})
