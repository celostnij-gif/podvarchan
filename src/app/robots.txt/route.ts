import { NextResponse } from 'next/server'
import { CACHE_CONTROL } from '@/lib/cache/cache-control-matrix'

/**
 * /robots.txt (AGENTS.md §6).
 *
 * Route handler (не MetadataRoute-файл `robots.ts`): Next ставит динамическим
 * metadata-роутам собственный `Cache-Control: s-maxage=1` и перебивает
 * next.config headers, из-за чего robots.txt рендерился на КАЖДЫЙ запрос
 * (~100 мс CPU; 33-54× 504/сутки при ботовых шквалах). Явный заголовок
 * здесь даёт edge-кеш (s-maxage=3600), как у sitemap.xml/llms.txt.
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

export async function GET() {
  const lines = [
    'User-agent: *',
    'Allow: /',
    'Allow: /_next/static/',
    'Disallow: /api/',
    'Disallow: /search/',
    '',
    ...AI_BOTS.flatMap((userAgent) => [`User-agent: ${userAgent}`, 'Allow: /', '']),
    'Sitemap: https://podvarchan.com/sitemap.xml',
  ]
  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': CACHE_CONTROL.robots,
    },
  })
}
