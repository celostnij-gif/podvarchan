/**
 * KV-caching layer for D1 queries.
 *
 * Cloudflare Free Plan CPU limit = 10ms. D1 queries are fast (20–80ms) but
 * a page often runs 5–7 of them → 1.4s TTFB. KV get is ~1–5ms.
 *
 * Cache miss → fetch from D1, schedule KV PUT via ctx.waitUntil() so the
 * write doesn't count toward the current request's CPU budget.
 *
 * Usage:
 *   const services = await withCache('services:ru', 600, () => getServices('ru'))
 */

import { getCloudflareContext } from '@opennextjs/cloudflare'

const PREFIX = 'd1c:' // short prefix to keep KV key size minimal

/* ── Minimal ExecutionContext type (avoids @cloudflare/workers-types dep) ── */
interface Ctx {
  waitUntil(promise: Promise<unknown>): void
}

/* ── helpers ── */

function getKvCtx(): { kv: KVNamespace; ctx: Ctx } | null {
  try {
    const { env, ctx } = getCloudflareContext()
    const kv = env.KV_BINDING as KVNamespace | undefined
    if (kv && ctx) return { kv, ctx: ctx as unknown as Ctx }
  } catch {
    // dev mode (next dev) — no Cloudflare context
  }
  return null
}

/* ── public API ── */

/**
 * Wraps an async fetchFn with KV cache.
 *
 * 1. Tries KV.get(key). On hit → JSON.parse → return.
 * 2. On miss → calls fetchFn() → schedules async KV.put via ctx.waitUntil() → returns result.
 *
 * TTL is in seconds. Default 300s (5 min).
 */
export async function withCache<T>(
  cacheKey: string,
  ttl: number,
  fetchFn: () => Promise<T>,
): Promise<T> {
  const cache = getKvCtx()

  /* Try cache hit */
  if (cache) {
    try {
      const raw = await cache.kv.get(`${PREFIX}${cacheKey}`)
      if (raw !== null) {
        return JSON.parse(raw) as T
      }
    } catch {
      // Parse error or KV error — fall through to fetch
    }
  }

  /* Cache miss — fetch fresh data */
  const data = await fetchFn()

  /* Schedule async KV write (never blocks the response) */
  if (cache) {
    cache.ctx.waitUntil(
      cache.kv
        .put(`${PREFIX}${cacheKey}`, JSON.stringify(data), { expirationTtl: ttl })
        .catch(() => {
          /* silent — KV write is best-effort */
        }),
    )
  }

  return data
}

/**
 * Invalidate one or more cache keys by prefix.
 *
 * Example: invalidateKeys('nav:') clears d1c:nav:HEADER:ru, d1c:nav:HEADER:uk, etc.
 * Example: invalidateKeys('page:HOME:') clears d1c:page:HOME:ru, d1c:page:HOME:uk.
 */
export async function invalidateKeys(prefix: string): Promise<void> {
  const cache = getKvCtx()
  if (!cache) return

  const fullPrefix = `${PREFIX}${prefix}`
  try {
    const { keys } = await cache.kv.list({ prefix: fullPrefix })
    if (keys.length === 0) return
    await Promise.all(keys.map((k) => cache!.kv.delete(k.name)))
  } catch {
    // best-effort
  }
}

/**
 * Blow away ALL D1 KV cache keys.
 * Called when the revalidation endpoint can't determine a specific entity type.
 */
export async function invalidateAll(): Promise<void> {
  const cache = getKvCtx()
  if (!cache) return

  try {
    const { keys } = await cache.kv.list({ prefix: PREFIX })
    if (keys.length === 0) return
    await Promise.all(keys.map((k) => cache!.kv.delete(k.name)))
  } catch {
    // best-effort
  }
}
