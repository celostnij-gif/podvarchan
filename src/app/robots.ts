import type { MetadataRoute } from 'next'
import { SITE } from '@/constants'

/**
 * Генерирует robots.txt.
 * Разрешает всем поисковым системам индексацию.
 * Указывает путь к sitemap.xml.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',           // API endpoints
          '/_next/',         // Next.js internal
          '/admin/',         // Admin (если будет)
          '/*?*',            // URL-параметры (избегаем дублей)
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: '/',
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  }
}
