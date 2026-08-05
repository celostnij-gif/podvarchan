import type { MetadataRoute } from 'next'

/**
 * /robots.txt (AGENTS.md §6).
 *
 * Served as a worker route (not a static asset) so the Cache-Control matrix
 * and the Content-Signal HTTP header from next.config.mjs apply.
 *
 * AI bot allow-list must never be narrowed (AGENTS.md §7 hard no):
 * GPTBot, Google-Extended, ClaudeBot, CCBot, Applebot-Extended,
 * Amazonbot, Bytespider, PerplexityBot, ChatGPT-User, CloudflareBrowserRenderingCrawler.
 */
const AI_BOTS = [
  'GPTBot',
  'Google-Extended',
  'ClaudeBot',
  'CCBot',
  'Applebot-Extended',
  'Amazonbot',
  'Bytespider',
  'PerplexityBot',
  'ChatGPT-User',
  'CloudflareBrowserRenderingCrawler',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/_next/static/'],
        disallow: ['/api/', '/search/'],
      },
      ...AI_BOTS.map((userAgent) => ({
        userAgent,
        allow: '/',
      })),
    ],
    sitemap: 'https://podvarchan.com/sitemap.xml',
  }
}
