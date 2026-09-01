import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getLlmsFull, LLMS_FULL_CACHE_CONTROL } from '@/lib/llms-full'

/**
 * GET /llms-full.txt — AI/GEO readiness (AGENTS.md §6, Phase 5.1).
 * Cached aggregate artifact (§3.5): the FINAL text lives in CONTENT_CACHE_KV
 * (`llms:full:txt`, TTL 3600) with an R2 durable snapshot; request path = 1 KV
 * get. Rebuild — max once per hour (cron) plus right after on-demand
 * invalidation (see /api/revalidate). URL index is generated from the same
 * light sources as sitemap.xml, so every sitemap URL is covered.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  let env: Parameters<typeof getLlmsFull>[0] = {}
  let waitUntil: ((promise: Promise<unknown>) => void) | undefined
  try {
    const { env: cfEnv, ctx } = getCloudflareContext()
    env = cfEnv
    waitUntil = ctx?.waitUntil?.bind(ctx)
  } catch {
    // dev mode (next dev) — no Cloudflare context; rebuild runs uncached
  }

  const { text, stale } = await getLlmsFull(env, waitUntil)
  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': LLMS_FULL_CACHE_CONTROL,
      ...(stale ? { 'X-Llms-Stale': '1' } : {}),
    },
  })
}
