import type { MetadataRoute } from 'next'
import { SITE } from '@/constants'

/**
 * Генерирует robots.txt.
 * Сайт максимально відкритий для всіх: пошукових систем, роботів та AI.
 * Жодних обмежень для GPTBot, ChatGPT-User або інших ботів.
 * API та адмінка виключені — там немає публічного контенту.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/', '/admin/'],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  }
}
