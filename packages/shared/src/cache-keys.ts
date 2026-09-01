/**
 * Logical cache keys for the CONTENT_CACHE_KV content cache (AGENTS.md §3).
 *
 * SINGLE SOURCE OF TRUTH — imported by both workers:
 *  - src/lib/db/public.ts      (reads: builds keys passed to withCache)
 *  - src/lib/db/kv-cache.ts    (namespaces with the `d1c:` prefix)
 *  - apps/admin/src/lib/actions/* + revalidate.ts (writes: targeted invalidation)
 *
 * The public /api/revalidate route deletes exactly these logical keys, so a
 * drift between the read-side keys and the invalidate-side keys would silently
 * leave stale content. Never inline a key template outside this module.
 */

/** Deterministic short hash (FNV-1a + djb2 variant) for cache keys that may
 *  exceed KV's 512-byte key limit (media id/URL lookups, id-list hashes). */
export function hashKey(input: string): string {
  let h1 = 0x811c9dc5
  let h2 = 0x01000193
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0
    h2 = (Math.imul(h2, 33) + c) >>> 0
  }
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')
}

export const cacheKeys = {
  servicesList: (locale: string) => `services:list:${locale}`,
  servicesSidebar: (locale: string) => `services:sidebar:${locale}`,
  service: (slug: string, locale: string) => `service:${slug}:${locale}`,
  serviceById: (id: string, locale: string) => `service:id:${id}:${locale}`,
  pricingList: (locale: string) => `pricing:list:${locale}`,
  blogCats: (locale: string) => `blog-cats:${locale}`,
  blogList: (locale: string) => `blog:list:${locale}`,
  /** Sitemap-only lightweight list (id/slug/updatedAt/publishedAt, no faqJson/excerpt). */
  blogListLite: (locale: string) => `blog:list:lite:${locale}`,
  /** llms-full.txt index list (id/slug/title/excerpt/categorySlug, no contentHtml/faqJson). */
  blogListIndex: (locale: string) => `blog:list:index:${locale}`,
  blogPost: (slug: string, locale: string) => `blog:${slug}:${locale}`,
  blogPostById: (id: string, locale: string) => `blog:id:${id}:${locale}`,
  blogCatPosts: (catSlug: string, locale: string) => `blog-cat:${catSlug}:${locale}`,
  /** Cross-locale slug pair for one published post (lang-switcher 301 fallback). */
  blogSlugPair: (slug: string) => `blog:slug-pair:${slug}`,
  /** Cross-locale slug pair for one published category (lang-switcher 301 fallback). */
  blogCatSlugPair: (slug: string) => `blog-cat-slug-pair:${slug}`,
  /** Cross-locale slug pair for one published service (lang-switcher 301 fallback). */
  serviceSlugPair: (slug: string) => `service:slug-pair:${slug}`,
  blogFirstImages: (idList: string) => `blog:images:${hashKey(idList)}`,
  page: (type: string, locale: string) => `page:${type}:${locale}`,
  faq: (group: string | undefined | null, locale: string) => `faq:${group ?? 'all'}:${locale}`,
  seo: (entityType: string, entityId: string, locale: string) =>
    `seo:${entityType}:${entityId}:${locale}`,
  mediaUrl: (idOrUrl: string) => `media:url:${hashKey(idOrUrl)}`,
  mediaVariants: (idOrUrl: string) => `media:variants:${hashKey(idOrUrl)}`,
  testimonials: (locale: string) => `testimonials:all:${locale}`,
  nav: (location: string, locale: string) => `nav:${location}:${locale}`,
  sitemapPageLastmods: 'sitemap:page-lastmods',
  sitemapCatLastmods: 'sitemap:cat-lastmods',
  /** Rendered /robots.txt artifact (static content, TTL 3600). */
  robotsTxt: () => 'robots:txt',
  contacts: () => 'contacts:all',
  settings: (key: string) => `settings:${key}`,
}

/**
 * Scoped wipe prefixes — for families where the exact keys are unknowable from
 * the admin side (media ids → hashed lookups, blog id-set hashes) or where the
 * whole small family is affected (faq groups, nav locations, blog category
 * lists). These never span entity types, so a wipe stays proportional to the
 * mutation (AGENTS.md §4 targeted invalidation).
 */
export const cacheKeyPrefixes = {
  media: 'media:',
  faq: 'faq:',
  nav: 'nav:',
  blogImages: 'blog:images:',
  blogCatPosts: 'blog-cat:',
  /** Cross-locale slug-pair lookups (lang-switcher 301 fallbacks) — wiped with their entity family. */
  blogSlugPair: 'blog:slug-pair:',
  blogCatSlugPair: 'blog-cat-slug-pair:',
  serviceSlugPair: 'service:slug-pair:',
}
