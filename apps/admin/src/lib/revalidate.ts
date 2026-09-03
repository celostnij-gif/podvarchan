import { revalidatePath } from 'next/cache'
import { cacheKeys, cacheKeyPrefixes } from '@podvarchan/shared'
import { buildRevalidateBatches, REVALIDATE_BATCH_LIMIT } from './revalidate-chunks'

/**
 * Cross-worker public cache invalidation + admin-local revalidate.
 *
 * Admin worker cannot call Next revalidatePath on the public worker.
 * Public paths → POST https://podvarchan.com/api/revalidate/
 * Admin paths  → revalidatePath in-process.
 *
 * See AGENTS.md §4 (invalidation contract) — path map lives in this file, the
 * logical cache-key map lives in packages/shared/src/cache-keys.ts (single
 * source of truth shared with the public worker's read side).
 */

export type RevalidateType = 'page' | 'layout'

export { cacheKeys, cacheKeyPrefixes }


/** Ensure trailing slash (site uses trailingSlash: true). */
function withTrailingSlash(path: string): string {
  if (path === '') return '/'
  if (path.includes('?') || path.includes('#')) return path
  if (path.endsWith('/')) return path
  // technical files without slash
  if (path.endsWith('.xml') || path.endsWith('.txt')) return path
  return `${path}/`
}

/**
 * Expand a path to both locales when locale prefix is missing.
 * `/blog` → `/ru/blog/`, `/uk/blog/`
 * `/` → `/ru/`, `/uk/`
 * `/ru/blog/x` → `/ru/blog/x/` (unchanged locale)
 */
export function expandLocalePaths(path: string): string[] {
  const raw = path.trim()
  if (!raw) return []

  // Technical / absolute site files
  if (raw === '/sitemap.xml' || raw.startsWith('/sitemap')) {
    return ['/sitemap.xml']
  }
  if (raw === '/robots.txt') {
    return ['/robots.txt']
  }

  if (raw.startsWith('/ru') || raw.startsWith('/uk')) {
    return [withTrailingSlash(raw)]
  }

  if (raw === '/' || raw === '') {
    return ['/ru/', '/uk/']
  }

  const bare = raw.startsWith('/') ? raw : `/${raw}`
  const noTrail = bare.replace(/\/+$/, '') || ''
  return [withTrailingSlash(`/ru${noTrail}`), withTrailingSlash(`/uk${noTrail}`)]
}

function unique(paths: string[]): string[] {
  return [...new Set(paths.filter(Boolean))]
}

/**
 * POST to the public worker after a content mutation (cross-worker).
 * Never throws to callers.
 *
 * Callers MUST `await` this: server actions terminate when the response is
 * sent, so a fire-and-forget promise never completes the fetch — this was
 * the root cause of stale public cache after publish/update (P0, 2026-08-08).
 */
export async function revalidatePublic(input: {
  paths: string[]
  type?: RevalidateType
  /** Exact logical CONTENT_CACHE_KV keys (cacheKeys.*) to delete — targeted invalidation. */
  keys?: string[]
  /** Scoped entity-family prefixes (cacheKeyPrefixes.*) to wipe. */
  prefixes?: string[]
}): Promise<void> {
  try {
    const secret = process.env.REVALIDATE_SECRET
    const base = (
      process.env.PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://podvarchan.com'
    ).replace(/\/$/, '')

    if (!secret) {
      console.warn('[revalidatePublic] REVALIDATE_SECRET not set — skip')
      return
    }

    const expanded = unique(input.paths.flatMap(expandLocalePaths))
    const keys = unique(input.keys ?? [])
    const prefixes = unique(input.prefixes ?? [])
    if (expanded.length === 0 && keys.length === 0 && prefixes.length === 0) return

    // The public /api/revalidate handler caps each array per request — split
    // oversized key sets into sequential batches instead of truncating, so a
    // bulk mutation never silently leaves part of the cache stale.
    const batches = buildRevalidateBatches(
      { paths: expanded, keys, prefixes },
      REVALIDATE_BATCH_LIMIT,
    )

    for (const batch of batches) {
      const body: Record<string, unknown> = {
        secret,
        type: input.type ?? 'page',
      }
      if (batch.paths.length) body.paths = batch.paths
      if (batch.keys.length) body.keys = batch.keys
      if (batch.prefixes.length) body.prefixes = batch.prefixes

      const res = await fetch(`${base}/api/revalidate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        console.error(`[revalidatePublic] failed ${res.status}`, batch.paths.join(', '))
      }
    }
  } catch (err) {
    console.error('[revalidatePublic] fetch error:', err)
  }
}

/** Admin UI cache only — paths must start with /admin */
export function revalidateAdmin(...paths: string[]): void {
  for (const p of paths) {
    if (p.startsWith('/admin')) {
      revalidatePath(p)
    }
  }
}

/**
 * Backward-compatible: public path(s) or admin path.
 * Bare `/blog` expands to both locales.
 */
export async function revalidateSitePath(path: string): Promise<void> {
  if (path.startsWith('/admin')) {
    revalidatePath(path)
    return
  }
  await revalidatePublic({ paths: [path], type: 'page' })
}

/**
 * Layout revalidate for a section root (invalidates children under segment).
 * Prefer for list areas: /blog, /uslugi, /poslugy, /faq, /
 */
export async function revalidateSiteLayout(path: string): Promise<void> {
  if (path.startsWith('/admin')) {
    revalidatePath(path, 'layout')
    return
  }
  await revalidatePublic({ paths: [path], type: 'layout' })
}

/** Blog area + sitemap (after post/category mutations). */
export async function revalidateBlogArea(): Promise<void> {
  await revalidatePublic({
    paths: ['/blog', '/sitemap.xml'],
    type: 'layout',
  })
}

/** Services area + home (featured) + sitemap. */
export async function revalidateServicesArea(): Promise<void> {
  await revalidatePublic({
    paths: ['/uslugi', '/uk/poslugy', '/', '/sitemap.xml'],
    type: 'layout',
  })
}

/** FAQ + home FAQ block. */
export async function revalidateFaqArea(): Promise<void> {
  await revalidatePublic({
    paths: ['/faq', '/'],
    type: 'layout',
  })
}

/** Home + chrome (nav/settings/testimonials). */
export async function revalidateHomeArea(): Promise<void> {
  await revalidatePublic({
    paths: ['/'],
    type: 'layout',
  })
}


/* ── Path builders (AGENTS.md §4 invalidation map) ── */

/** Blog post: detail + list + category + sitemap */
export function getBlogPostRevalidatePaths(
  ruSlug: string,
  ukSlug: string,
  ruCat?: string,
  ukCat?: string,
): string[] {
  const paths = [
    `/ru/blog/${ruSlug}/`,
    `/uk/blog/${ukSlug}/`,
    '/ru/blog/',
    '/uk/blog/',
    '/sitemap.xml',
  ]
  if (ruCat) paths.push(`/ru/blog/kategoriya/${ruCat}/`)
  if (ukCat) paths.push(`/uk/blog/kategoriya/${ukCat}/`)
  return paths
}

/** Service: detail + list + home (if featured) + sitemap */
export function getServiceRevalidatePaths(
  ruSlug: string,
  ukSlug: string,
  featured?: boolean,
): string[] {
  const paths = [
    `/ru/uslugi/${ruSlug}/`,
    `/uk/poslugy/${ukSlug}/`,
    '/ru/uslugi/',
    '/uk/poslugy/',
    '/sitemap.xml',
  ]
  if (featured) paths.push('/ru/', '/uk/')
  return paths
}

/** FAQ: faq page + home */
export function getFaqRevalidatePaths(): string[] {
  return ['/ru/faq/', '/uk/faq/', '/ru/', '/uk/']
}

/** Testimonials/navigation/settings: home only */
export function getHomeRevalidatePaths(): string[] {
  return ['/ru/', '/uk/']
}

/* Page type → public route mapping */
const PAGE_TYPE_ROUTES: Record<string, string> = {
  HOME: '/',
  METHOD: '/metod/',
  ABOUT: '/ob-avtore/',
  PRICING: '/tseny/',
  CONTACTS: '/kontakty/',
  PRIVACY: '/privacy/',
  DISCLAIMER: '/disclaimer/',
}

export function getPageRevalidatePaths(type: string): string[] {
  const route = PAGE_TYPE_ROUTES[type] || '/'
  return [`/ru${route}`.replace(/\/+/g, '/'), `/uk${route}`.replace(/\/+/g, '/')]
}

/* ── Cache-key collectors (AGENTS.md §4 targeted invalidation) ──
 * Logical keys are built with cacheKeys.* from packages/shared/src/cache-keys.ts —
 * the SAME builders the public worker uses for reads, so invalidation can
 * never drift from the read side. Pass the result as `keys` to revalidatePublic. */

/** Blog post: detail + lists + categories (old/new slugs/cats from caller) + SEO. */
export function getBlogPostCacheKeys(
  ruSlug: string,
  ukSlug: string,
  ruCat?: string,
  ukCat?: string,
  postId?: string,
): string[] {
  const keys = [
    cacheKeys.blogPost(ruSlug, 'ru'),
    cacheKeys.blogPost(ukSlug, 'uk'),
    cacheKeys.blogList('ru'),
    cacheKeys.blogList('uk'),
    // Sitemap XML is rebuilt from the lite list (blog:list:lite) — a post
    // mutation must invalidate it too, or the map keeps stale slugs/dates
    // until the 1 h TTL expires (see src/lib/sitemap.ts).
    cacheKeys.blogListLite('ru'),
    cacheKeys.blogListLite('uk'),
    // llms-full.txt URL index is built from the index list (blog:list:index).
    cacheKeys.blogListIndex('ru'),
    cacheKeys.blogListIndex('uk'),
    cacheKeys.blogCats('ru'),
    cacheKeys.blogCats('uk'),
  ]
  if (ruCat) keys.push(cacheKeys.blogCatPosts(ruCat, 'ru'))
  if (ukCat) keys.push(cacheKeys.blogCatPosts(ukCat, 'uk'))
  if (postId) {
    keys.push(
      cacheKeys.seo('blog_post', postId, 'ru'),
      cacheKeys.seo('blog_post', postId, 'uk'),
      cacheKeys.blogSlugsById(postId),
    )
  }
  return keys
}

/** Service: detail + lists + sidebar + SEO (+ home if featured). */
export function getServiceCacheKeys(
  ruSlug: string,
  ukSlug: string,
  serviceId?: string,
  featured?: boolean,
): string[] {
  const keys = [
    cacheKeys.service(ruSlug, 'ru'),
    cacheKeys.service(ukSlug, 'uk'),
    cacheKeys.servicesList('ru'),
    cacheKeys.servicesList('uk'),
    cacheKeys.servicesSidebar('ru'),
    cacheKeys.servicesSidebar('uk'),
  ]
  if (serviceId) {
    keys.push(
      cacheKeys.seo('service', serviceId, 'ru'),
      cacheKeys.seo('service', serviceId, 'uk'),
      cacheKeys.serviceSlugsById(serviceId),
    )
  }
  if (featured) {
    keys.push(cacheKeys.page('HOME', 'ru'), cacheKeys.page('HOME', 'uk'))
  }
  return keys
}

/** Page: both locales for a page type. */
export function getPageCacheKeys(type: string): string[] {
  return [cacheKeys.page(type, 'ru'), cacheKeys.page(type, 'uk')]
}

/** Home page + its SEO meta (both locales). */
export function getHomeCacheKeys(homeId?: string): string[] {
  const keys = [cacheKeys.page('HOME', 'ru'), cacheKeys.page('HOME', 'uk')]
  if (homeId) {
    keys.push(cacheKeys.seo('page', homeId, 'ru'), cacheKeys.seo('page', homeId, 'uk'))
  }
  return keys
}

/** Testimonials (home blocks, both locales). */
export function getTestimonialsCacheKeys(): string[] {
  return [cacheKeys.testimonials('ru'), cacheKeys.testimonials('uk')]
}
