import type { MetadataRoute } from 'next'
import { SITE } from '@/constants'

/**
 * Генерирует robots.txt.
 * Сайт максимально відкритий для ВСІХ: пошукових систем, AI-ботів, скреперів.
 * API та _next виключені — там немає публічного контенту.
 *
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      /* ── General rules ── */
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/'],
      },

      
      { userAgent: 'Amazonbot', allow: '/' },
      { userAgent: 'Applebot-Extended', allow: '/' },
      { userAgent: 'Bytespider', allow: '/' },
      { userAgent: 'CCBot', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'CloudflareBrowserRenderingCrawler', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'meta-externalagent', allow: '/' },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  }
}

