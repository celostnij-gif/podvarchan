/**
 * KV-caching layer for D1 queries.
 *
 * Cloudflare Free Plan CPU limit = 10ms. D1 queries are fast (20–80ms) but
 * a page often runs 5–7 of them → 1.4s TTFB. KV get is ~1–5ms.
 *
 * Cache miss → fetch from D1, write to KV synchronously, return result.
 * No ctx.waitUntil — Server Components in OpenNext don't reliably expose it.
 * The first request after deploy populates the cache; subsequent requests
 * read from KV and skip D1 entirely.
 *
 * Usage:
 *   const services = await withCache('services:ru', 600, () => getServices('ru'))
 */

import { getCloudflareContext } from '@opennextjs/cloudflare'

const PREFIX = 'd1c:' // short prefix to keep KV key size minimal

/* ── helpers ── */

function getKv(): KVNamespace | null {
  try {
    const { env } = getCloudflareContext()
    const kv = env['KV_BINDING'] as KVNamespace | undefined
    return kv ?? null
  } catch {
    // dev mode (next dev) — no Cloudflare context, or env without KV_BINDING
  }
  return null
}

/* ── public API ── */

/**
 * Wraps an async fetchFn with KV cache.
 *
 * 1. Tries KV.get(key). On hit → JSON.parse → return (fast path).
 * 2. On miss → calls fetchFn() → sync KV.put → return result.
 *    The miss path is as expensive as a bare D1 call, but subsequent requests
 *    hit the KV fast path.
 *
 * TTL is in seconds. Default 300s (5 min).
 */
export async function withCache<T>(
  cacheKey: string,
  ttl: number,
  fetchFn: () => Promise<T>,
): Promise<T> {
  const kv = getKv()
  const fullKey = `${PREFIX}${cacheKey}`

  /* Try cache hit */
  if (kv) {
    try {
      const raw = await kv.get(fullKey)
      if (raw !== null) {
        return JSON.parse(raw) as T
      }
    } catch {
      // Parse error or KV error — fall through to fetch
    }
  }

  /* Cache miss — fetch fresh data */
  const data = await fetchFn()

  /* Write to KV (sync — no ctx.waitUntil needed) */
  if (kv) {
    kv
      .put(fullKey, JSON.stringify(data), { expirationTtl: ttl })
      .catch(() => {
        /* silent — KV write is best-effort */
      })
  }

  return data
}

/**
 * Invalidate one or more cache keys by prefix.
 *
 * Example: invalidateKeys('nav:') clears d1c:nav:HEADER:ru, d1c:nav:HEADER:uk, etc.
 */
export async function invalidateKeys(prefix: string): Promise<void> {
  const kv = getKv()
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

/**
 * Blow away ALL D1 KV cache keys.
 */
export async function invalidateAll(): Promise<void> {
  const kv = getKv()
  if (!kv) return

  try {
    const { keys } = await kv.list({ prefix: PREFIX })
    if (keys.length === 0) return
    await Promise.all(keys.map((k) => kv.delete(k.name)))
  } catch {
    // best-effort
  }
}
