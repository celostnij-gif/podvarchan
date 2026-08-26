/**
 * Typed access layer over `cache-control-values.json` (AGENTS.md §3).
 *
 * THE JSON FILE IS THE SINGLE SOURCE OF TRUTH: it is imported here (runtime),
 * by next.config.mjs (edge header rules) and validated by
 * scripts/check-cache-sync.mjs in CI — no hand-duplicated literals anywhere
 * anymore (the old "keep in sync manually" comment in next.config.mjs is gone).
 *
 * The header must ALWAYS carry a long s-maxage: freshness is guaranteed by
 * on-demand invalidation (AGENTS.md §4), not by short TTLs — a short TTL only
 * multiplies D1 reads without improving freshness.
 */
import values from './cache-control-values.json'

type CacheControlKey = keyof Omit<typeof values, '_comment'>

const cacheControl = {} as Record<CacheControlKey, string>
for (const [key, value] of Object.entries(values)) {
  if (key !== '_comment') cacheControl[key as CacheControlKey] = value as string
}

export const CACHE_CONTROL = cacheControl
