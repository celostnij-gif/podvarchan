import { NextResponse } from 'next/server'
import { CACHE_CONTROL } from '@/lib/cache/cache-control-matrix'
import { withCache } from '@/lib/db/kv-cache'
import { cacheKeys } from '@podvarchan/shared'

/**
 * /robots.txt (AGENTS.md §6).
 *
 * Route handler, НЕ MetadataRoute-файл `robots.ts`: Next ставит динамическим
 * metadata-роутам собственный `Cache-Control: s-maxage=1` и перебивает
 * next.config headers — robots.txt рендерился на КАЖДЫЙ запрос (~100 мс CPU;
 * 33-54× 504/сутки при ботовых шквалах).
 *
 * Phase 0.3 (2026-08-25): `force-dynamic` выводит роут из ISR-инкрементального
 * кеша OpenNext — иначе fixISRHeaders() на ISR-HIT переписывает s-maxage в
 * остаток TTL кеша (живой прод отдавал `s-maxage=1` вместо 3600). Тот же
 * паттерн, что у /sitemap.xml: готовый артефакт целиком в CONTENT_CACHE_KV
 * (`d1c:robots:txt`, TTL 3600) с R2-зеркалом; запрос при тёплом кеше = 1 KV get.
 * Прогрев — cron каждые 50 минут (wrangler/worker.ts scheduled()).
 *
 * AI bot allow-list must never be narrowed (AGENTS.md §7 hard no):
 * GPTBot, Google-Extended, ClaudeBot, CCBot, Applebot-Extended,
 * Amazonbot, Bytespider, PerplexityBot, ChatGPT-User, CloudflareBrowserRenderingCrawler.
 */
export const dynamic = 'force-dynamic'

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

async function generateRobotsTxt(): Promise<string> {
  return [
    'User-agent: *',
    'Allow: /',
    'Allow: /_next/static/',
    'Disallow: /api/',
    'Disallow: /search/',
    '',
    ...AI_BOTS.flatMap((userAgent) => [`User-agent: ${userAgent}`, 'Allow: /', '']),
    'Sitemap: https://podvarchan.com/sitemap.xml',
  ].join('\n')
}

export async function GET() {
  // Content is fully static — TTL 3600 matches CACHE_CONTROL.robots; no
  // invalidation path needed (§3.5 aggregate-artifact rule: cache the finished
  // artifact, rebuild at most hourly, keep warm via cron).
  const txt = await withCache(cacheKeys.robotsTxt(), 3600, generateRobotsTxt)

  return new NextResponse(txt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': CACHE_CONTROL.robots,
    },
  })
}
