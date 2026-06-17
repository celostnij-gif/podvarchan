import type { MetadataRoute } from 'next'
import { SITE } from '@/constants'

/**
 * Генерирует robots.txt.
 * Сайт максимально відкритий для ВСІХ: пошукових систем, AI-ботів, скреперів.
 * API та _next виключені — там немає публічного контенту.
 *
 * Cloudflare AI Audit додає свій блок на рівні edge, який блокує деякі AI-бота.
 * Ми НЕ можемо його прибрати через API (токен без прав на zone settings),
 * але додаємо явні Allow:/ для кожного заблокованого бота нижче.
 * Правила robots.txt: при однаковій специфічності Allow перекриває Disallow.
 *
 * Якщо хочете прибрати блок AI Audit повністстю — це вручну:
 * Cloudflare Dashboard → Security → Bots → AI Audit → вимкнути
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

      /* ── Override Cloudflare AI Audit blocks ── */
      // Cloudflare blocks these at the edge;
      // our Allow:/ overrides their Disallow:/ (same path specificity)
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

