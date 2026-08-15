import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/env'
import { cdnTagForPath } from '@/lib/cdn-cache'
import { invalidateExact, invalidateKeys } from '@/lib/db/kv-cache'

/**
 * POST /api/revalidate
 *
 * Called by admin worker after content mutations (cross-worker).
 *
 * Body JSON:
 *   { secret, path?, paths?, type?: 'page' | 'layout', keys?: string[], prefixes?: string[] }
 *
 * - path / paths: public site paths e.g. /ru/blog/slug/ (prefer locale + trailing slash)
 * - type: 'page' (default) or 'layout' (segment + children)
 * - keys: exact logical CONTENT_CACHE_KV keys to delete (cacheKeys.* from
 *   @podvarchan/shared, no `d1c:` prefix — applied here). Targeted per-mutation
 *   invalidation (AGENTS.md §4), never a namespace wipe.
 * - prefixes: scoped entity-family prefixes to wipe (e.g. 'media:' for hashed
 *   media lookups unknowable from the admin side).
 *
 * Keep this handler cheap — Free plan CPU budget.
 */
type RevalidateBody = {
  secret?: string
  path?: string
  paths?: string[]
  type?: string
  keys?: string[]
  prefixes?: string[]
}

const MAX_BATCH = 40

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === 'string').map((v) => v.trim()).filter((v) => v.length > 0)
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RevalidateBody

    if (!body.secret || body.secret !== env.REVALIDATE_SECRET) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
    }

    const paths = [
      ...stringArray(body.paths),
      ...stringArray([body.path].filter((p): p is string => typeof p === 'string')),
    ].slice(0, MAX_BATCH)

    if (paths.length === 0) {
      return NextResponse.json({ error: 'Missing path(s)' }, { status: 400 })
    }

    const keys = stringArray(body.keys).slice(0, MAX_BATCH)
    const prefixes = stringArray(body.prefixes).slice(0, MAX_BATCH)
    const useLayout = body.type === 'layout'
    const done: string[] = []
    const errors: string[] = []

    // Targeted D1 KV cache invalidation — delete exactly the affected keys
    try {
      await invalidateExact(keys)
    } catch {
      // best-effort — cache TTL will expire eventually
    }
    try {
      await Promise.all(prefixes.map((p) => invalidateKeys(p)))
    } catch {
      // best-effort — cache TTL will expire eventually
    }

    // Sitemap XML is cached as a whole (sitemap:xml, see src/lib/sitemap.ts) —
    // when the map itself is invalidated, delete KV+R2 and warm the fresh XML
    // in the background so the first request is a KV hit, never a heavy render.
    if (paths.includes('/sitemap.xml')) {
      try {
        const { env: cfEnv, ctx } = await import('@opennextjs/cloudflare').then((m) =>
          m.getCloudflareContext(),
        )
        const { invalidateSitemapXml, warmSitemapXml } = await import('@/lib/sitemap')
        await invalidateSitemapXml(cfEnv)
        ctx?.waitUntil?.(warmSitemapXml(cfEnv).catch(() => {}))
      } catch {
        // best-effort — CDN SWR (86400 s) covers the gap; next render repopulates
      }
    }

    for (const p of paths) {
      try {
        if (useLayout) {
          revalidatePath(p, 'layout')
        } else {
          revalidatePath(p)
        }
        done.push(p)
      } catch {
        errors.push(p)
      }
    }

    // CDN edge cache purge (P0-2, 2026-08-05): the OpenNext wrapper (see
    // open-next.config.ts) stores cacheable GETs in `caches.default` keyed by
    // URL. `cache.delete` clears only the data center this request lands in —
    // when CACHE_PURGE_API_TOKEN / CACHE_PURGE_ZONE_ID are configured, the same
    // entries are also purged globally by Cache-Tag (_N_T_<path>).
    try {
      const baseUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
      const cdnPaths = paths.map((p) => `${baseUrl}${p.startsWith('/') ? p : `/${p}`}`)
      await Promise.allSettled(cdnPaths.map((url) => caches.default.delete(new Request(url)).catch(() => false)))

      const purgeToken = process.env.CACHE_PURGE_API_TOKEN
      const purgeZoneId = process.env.CACHE_PURGE_ZONE_ID
      if (purgeToken && purgeZoneId) {
        const tags = [...new Set(paths.map((p) => cdnTagForPath(p)))]
        // Purge API limit: 30 tags per request.
        for (let i = 0; i < tags.length; i += 30) {
          await fetch(`https://api.cloudflare.com/client/v4/zones/${purgeZoneId}/purge_cache`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${purgeToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tags: tags.slice(i, i + 30) }),
          }).catch(() => {
            // best-effort — local purge + TTL cover the gap
          })
        }
      }
    } catch {
      // best-effort — local purge + TTL cover the gap
    }

    // Warm-up (AGENTS.md §3.5): after invalidation the affected paths are cold
    // at the edge. Self-fetch them through the service binding so the next real
    // visitor gets an edge-cache HIT instead of a cold render at peak traffic.
    // Runs in ctx.waitUntil (fire-and-forget, its own subrequest budgets).
    const warmable = paths.filter((p) => !p.startsWith('/api/'))
    if (warmable.length > 0) {
      try {
        const { env: cfEnv, ctx } = await import('@opennextjs/cloudflare').then((m) =>
          m.getCloudflareContext(),
        )
        const selfRef = cfEnv.WORKER_SELF_REFERENCE
        const baseUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
        if (selfRef && ctx?.waitUntil) {
          // Serial chunks of self-fetches to avoid a stampede on bulk
          // revalidations (up to MAX_BATCH=40 paths fire-and-forget in
          // the background after this handler returns).
          const CHUNK = 6
          const warm = (p: string) =>
            selfRef
              .fetch(`${baseUrl}${p.startsWith('/') ? p : `/${p}`}`)
              .then((res: Response) => {
                res.body?.cancel()
              })
              .catch(() => {
                // best-effort — TTL / next request covers the gap
              })
          ctx.waitUntil(
            (async () => {
              for (let i = 0; i < warmable.length; i += CHUNK) {
                await Promise.allSettled(warmable.slice(i, i + CHUNK).map(warm))
              }
            })(),
          )
        }
      } catch {
        // best-effort
      }
    }

    return NextResponse.json({
      revalidated: errors.length === 0,
      paths: done,
      errors: errors.length ? errors : undefined,
      type: useLayout ? 'layout' : 'page',
      keysDeleted: keys.length,
      prefixesWiped: prefixes.length,
    })
  } catch {
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 })
  }
}
