import type { MetadataRoute } from 'next'
import { SITE } from '@/constants'

/**
 * Генерирует robots.txt.
 * Сайт максимально відкритий для пошукових систем та роботів.
 * API та _next виключені — там немає публічного контенту.
 *
 * УВАГА: Cloudflare AI Audit може додавати свої правила на рівні edge.
 * Якщо хочете прибрати блокування AI-ботів — вимкніть AI Audit
 * в Cloudflare Dashboard → Security → Bots → AI Audit.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/'],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  }
}
