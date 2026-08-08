/**
 * KV-caching layer for D1 queries.
 *
 * Cloudflare Free Plan CPU limit = 10ms. D1 queries are fast (20–80ms) but
 * a page often runs 5–7 of them → 1.4s TTFB. KV get is ~1–5ms.
 *
 * Three-tier contract (AGENTS.md §3):
 *   CDN edge cache → KV (CONTENT_CACHE_KV) → R2 durable snapshot → D1.
 *
 * Cache miss → fetch from D1, write to KV synchronously, mirror a durable
 * copy to R2 (ctx.waitUntil when available — OpenNext exposes it; plain
 * await on the rare cold path otherwise). On D1 error → R2 fallback.
 *
 * KV namespace: CONTENT_CACHE_KV (dedicated; RATE_LIMIT_KV is a separate
 * namespace used only by src/lib/rateLimit.ts — never mix purposes).
 * R2: CONTENT_CACHE_R2 (dedicated bucket — NOT the OpenNext ISR bucket).
 *
 * Logical keys (cacheKeys.* from @podvarchan/shared) are namespaced here
 * with the `d1c:` prefix. Invalidation is targeted: exact logical keys or a
 * scoped entity-family prefix (see invalidateExact / invalidateKeys) — never
 * a full namespace wipe (AGENTS.md §4).
 *
 * Usage:
 *   const services = await withCache(cacheKeys.servicesList('ru'), 21600, () => getServicesUncached('ru'))
 */

import { getCloudflareContext } from '@opennextjs/cloudflare'

const PREFIX = 'd1c:' // short prefix to keep KV key size minimal
const R2_PREFIX = 'content/'

interface CacheBindings {
  kv?: KVNamespace
  r2?: R2Bucket
  waitUntil?: (promise: Promise<unknown>) => void
}

function getBindings(): CacheBindings | null {
  try {
    const { env, ctx } = getCloudflareContext()
    return {
      kv: env['CONTENT_CACHE_KV'] as KVNamespace | undefined,
      r2: env['CONTENT_CACHE_R2'] as R2Bucket | undefined,
      waitUntil: ctx?.waitUntil?.bind(ctx),
    }
  } catch {
    // dev mode (next dev) — no Cloudflare context, or env without bindings
  }
  return null
}

/**
 * Wraps an async fetchFn with KV cache + R2 durable fallback.
 *
 * 1. Tries KV.get(key). On hit → JSON.parse → return (fast path).
 * 2. On miss → fetchFn() → sync KV.put + R2 mirror → return result.
 * 3. On fetchFn error → tries R2 durable snapshot; rethrows if absent.
 *
 * TTL is in seconds.
 */
export async function withCache<T>(
  cacheKey: string,
  ttl: number,
  fetchFn: () => Promise<T>,
): Promise<T> {
  const b = getBindings()
  const fullKey = `${PREFIX}${cacheKey}`

  /* Try cache hit */
  if (b?.kv) {
    try {
      const raw = await b.kv.get(fullKey)
      if (raw !== null) {
        if (raw === 'null') {
          // Stale negative-cache entry ('null' written by an older build).
          // Drop it and treat as a miss — a 404 must never outlive the
          // publish that fixes it (P0 follow-up, 2026-08-08).
          b.kv.delete(fullKey).catch(() => {})
        } else {
          return JSON.parse(raw) as T
        }
      }
    } catch {
      // Parse error or KV error — fall through to fetch
    }
  }

  /* Cache miss — fetch fresh data */
  let data: T
  try {
    data = await fetchFn()
  } catch (d1Error) {
    // D1 unavailable — graceful degradation via R2 durable snapshot
    if (b?.r2) {
      try {
        const r2Fallback = await b.r2.get(`${R2_PREFIX}${fullKey}.json`)
        if (r2Fallback) return (await r2Fallback.json()) as T
      } catch {
        // R2 also failed — surface the original D1 error
      }
    }
    throw d1Error
  }

  const serialized = JSON.stringify(data)

  /* Never cache null/undefined — a missing entity (404) must be re-checked
   * after any mutation instead of pinning the negative result for TTL
   * (P0 follow-up, 2026-08-08). */
  if (serialized === 'null' || serialized === undefined) {
    return data
  }

  /* Write to KV (sync — no ctx.waitUntil needed) */
  if (b?.kv) {
    b.kv
      .put(fullKey, serialized, { expirationTtl: ttl })
      .catch(() => {
        /* silent — KV write is best-effort */
      })
  }

  /* Mirror durable copy to R2 (fire-and-forget via ctx.waitUntil when available) */
  if (b?.r2) {
    const copy = b.r2
      .put(`${R2_PREFIX}${fullKey}.json`, serialized)
      .catch(() => {
        /* silent — R2 mirror is best-effort */
      })
    if (b.waitUntil) {
      b.waitUntil(copy)
    } else {
      await copy
    }
  }

  return data
}

/**
 * Delete exact logical cache keys (1 KV delete per key — no list()).
 * Keys are namespaced with the `d1c:` prefix here; pass logical keys
 * (cacheKeys.* output) from the caller.
 */
export async function invalidateExact(logicalKeys: string[]): Promise<void> {
  const kv = getBindings()?.kv
  if (!kv) return

  const unique = [...new Set(logicalKeys.filter((k): k is string => typeof k === 'string' && k.length > 0))]
  if (unique.length === 0) return
  try {
    await Promise.all(unique.map((k) => kv.delete(`${PREFIX}${k}`)))
  } catch {
    // best-effort
  }
}

/**
 * Invalidate cache keys by logical prefix (scoped wipe of one entity family).
 *
 * Example: invalidateKeys('nav:') clears d1c:nav:HEADER:ru, d1c:nav:HEADER:uk, etc.
 */
export async function invalidateKeys(prefix: string): Promise<void> {
  const kv = getBindings()?.kv
  if (!kv) return

  const fullPrefix = `${PREFIX}${prefix}`
  try {
    const { keys } = await kv.list({ prefix: fullPrefix })
    if (keys.length === 0) return
    await Promise.all(keys.map((k) => kv.delete(k.name)))
  } catch {
    // best-effort
  }
}
