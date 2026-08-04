/**
 * Single source of truth for the CDN Cache-Control matrix (AGENTS.md §3).
 *
 * TS files import these constants. `next.config.mjs` cannot import TypeScript
 * from `src/` (plain ESM, no transpile) — the values there are duplicated by
 * hand; keep them in sync and reference this module in comments.
 *
 * The header must ALWAYS carry a long s-maxage: freshness is guaranteed by
 * on-demand invalidation (AGENTS.md §4), not by short TTLs — a short TTL only
 * multiplies D1 reads without improving freshness.
 */
export const CACHE_CONTROL = {
  /** Home / Services / FAQ / About / Method / Pricing / Contacts / Privacy / Disclaimer */
  pages: 'public, s-maxage=604800, stale-while-revalidate=2592000, stale-if-error=604800',
  /** Blog list / post / category */
  blog: 'public, s-maxage=86400, stale-while-revalidate=604800, stale-if-error=604800',
  /** /sitemap.xml — KV-cached XML (see src/lib/sitemap.ts), short s-maxage on purpose:
   *  the route handler itself is cheap (1 KV get) and crawlers re-request often. */
  sitemapXml: 'public, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=604800',
  robots: 'public, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=604800',
  llms: 'public, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=604800',
  llmsFull: 'public, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=604800',
  /** Static assets / R2 media */
  staticImmutable: 'public, max-age=31536000, immutable',
  /** /api/preview — never cached, unconditionally */
  preview: 'no-cache, no-store, must-revalidate',
} as const
