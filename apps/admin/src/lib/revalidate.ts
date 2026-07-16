import { revalidatePath } from 'next/cache'

/**
 * Cross-worker public cache invalidation + admin-local revalidate.
 *
 * Admin worker cannot call Next revalidatePath on the public worker.
 * Public paths → POST https://podvarchan.com/api/revalidate/
 * Admin paths  → revalidatePath in-process.
 *
 * See TEMP/REVALIDATE_MAP.md and AGENT.md §8.
 */

export type RevalidateType = 'page' | 'layout'

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
 * Fire-and-forget POST to public worker. Never throws to callers.
 */
export async function revalidatePublic(input: {
  paths: string[]
  type?: RevalidateType
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
    if (expanded.length === 0) return

    const res = await fetch(`${base}/api/revalidate/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret,
        paths: expanded,
        type: input.type ?? 'page',
      }),
    })

    if (!res.ok) {
      console.error(`[revalidatePublic] failed ${res.status}`, expanded.join(', '))
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
 * Prefer for list areas: /blog, /uslugi, /faq, /
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
    paths: ['/uslugi', '/', '/sitemap.xml'],
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


/* ── Path builders per REVALIDATE_MAP ── */

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
    `/uk/uslugi/${ukSlug}/`,
    '/ru/uslugi/',
    '/uk/uslugi/',
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
