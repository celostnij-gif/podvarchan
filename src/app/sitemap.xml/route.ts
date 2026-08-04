import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getSitemapXml, SITEMAP_CACHE_CONTROL } from '@/lib/sitemap'

/**
 * /sitemap.xml — route handler, а не metadata-файл `sitemap.ts`:
 * metadata-роуты в OpenNext рендерятся вне request-контекста и не достают D1
 * (сборка/рантайм всегда падают в fallback-константы). Route handler
 * рендерится воркером с живым D1.
 *
 * Рендер дорогой (6 источников, ~150 КБ сериализации) и превышал 10 мс
 * CPU-бюджет на холодном KV (error 1102, мёртвая петля) — поэтому ГОТОВЫЙ
 * XML кешируется текстом в CONTENT_CACHE_KV (`sitemap:xml`, TTL 3600) с
 * R2-снапшотом: запрос = 1 KV get. Сборка — максимум раз в час, плюс прогрев
 * сразу после on-demand-инвалидации (см. src/lib/sitemap.ts, /api/revalidate).
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  let env: Parameters<typeof getSitemapXml>[0] = {}
  let waitUntil: ((promise: Promise<unknown>) => void) | undefined
  try {
    const { env: cfEnv, ctx } = getCloudflareContext()
    env = cfEnv
    waitUntil = ctx?.waitUntil?.bind(ctx)
  } catch {
    // dev mode (next dev) — no Cloudflare context; getSitemapXml rebuilds
    // without cache and fails on missing D1 exactly like before
  }

  const { xml, stale } = await getSitemapXml(env, waitUntil)
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': SITEMAP_CACHE_CONTROL,
      ...(stale ? { 'X-Sitemap-Stale': '1' } : {}),
    },
  })
}
