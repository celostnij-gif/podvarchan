import { SITE, SERVICES, STATIC_PAGES, BLOG_CATEGORIES } from '@/constants'
import { CACHE_CONTROL } from '@/lib/cache/cache-control-matrix'
import {
  getPublishedServices,
  getPublishedBlogCategories,
  getAllBlogPosts,
} from '@/lib/content'
import { getBlogPostsLite, getPageLastmods, getCategoryLastmods } from '@/lib/db/public'
import { SERVICE_SLUG_UK, BLOG_SLUG_UK, CATEGORY_SLUG_UK } from '@/lib/slugMapping'

const BASE = SITE.url

/**
 * Sitemap XML with a cached-ready-XML layer (AGENTS.md §3).
 *
 * Why: the previous route rendered the full map on every CDN miss — 6 cache
 * lookups + up to 6 D1 queries + ~150 KB serialization in one request. With a
 * cold KV (overnight TTL expiry) that exceeded the Free-plan ~10 ms CPU budget
 * → error 1102 (platform kills the isolate; try/catch does NOT catch it), and
 * because the KV put never completed, every following request hit the same
 * cold path (dead loop, site down at first morning traffic).
 *
 * Fix, three layers:
 *  1. The FINAL XML is cached as text — request path = 1 KV get (~1 ms CPU).
 *     Rebuild happens at most once per hour, plus warm-up after invalidation
 *     and a cron warm (see wrangler/worker.ts scheduled).
 *  2. The rebuild itself is cheap: sitemap uses the lite blog getter
 *     (id/slug/updatedAt/publishedAt only, own KV key) instead of the full
 *     blog:list with faqJson/excerpt — so even a genuinely cold render fits
 *     the CPU budget instead of just being rare.
 *  3. R2 durable snapshot (no TTL) — served with X-Sitemap-Stale if a rebuild
 *     ever fails, so the endpoint degrades to stale-but-alive, never 500.
 */

export const SITEMAP_XML_KEY = 'sitemap:xml'
export const SITEMAP_XML_TTL = 3600
export const R2_SITEMAP_KEY = 'content/sitemap.xml'
export const SITEMAP_CACHE_CONTROL = CACHE_CONTROL.sitemapXml

interface SitemapEntry {
  url: string
  lastModified?: Date
  changeFrequency?: string
  priority?: number
  alternates: { ru: string; uk: string; 'x-default': string }
}

function addPair(
  entries: SitemapEntry[],
  ruUrl: string,
  ukUrl: string,
  priority: number,
  changeFrequency: string,
  lastModified?: Date,
) {
  const alternates = { ru: ruUrl, uk: ukUrl, 'x-default': ruUrl }
  entries.push({ url: ruUrl, alternates, priority, changeFrequency, lastModified })
  entries.push({ url: ukUrl, alternates, priority, changeFrequency, lastModified })
}

function buildEntries(): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = []

  return Promise.all([
    getPublishedServices('ru').catch(() => null),
    getPublishedServices('uk').catch(() => null),
    getBlogPostsLite('ru').catch(() => null),
    getBlogPostsLite('uk').catch(() => null),
    getPublishedBlogCategories('ru').catch(() => null),
    getPublishedBlogCategories('uk').catch(() => null),
    getPageLastmods().catch(() => null),
    getCategoryLastmods().catch(() => null),
  ]).then(([ruServices, ukServices, ruPosts, ukPosts, ruCats, ukCats, pageLastmods, catLastmods]) => {
    /* ── 1. Статические страницы (tseny/tsiny и ob-avtore/pro-avtora — разные UK-слэги) ── */
    const pageMods = pageLastmods ?? {}
    const catMods = catLastmods ?? {}
    // Index pages (uslugi/, blog/) carry the freshest item revision as their
    // lastmod — already in memory from the lite getters, no extra queries.
    const maxServiceMod = ruServices?.reduce<Date | undefined>(
      (max, s) => (s.updatedAt && (!max || s.updatedAt > max) ? s.updatedAt : max),
      undefined,
    )
    const maxPostMod = ruPosts?.reduce((max, p) => (p.updatedAt && (!max || p.updatedAt > max) ? p.updatedAt : max), '') ?? ''
    const PAGE_TYPE_BY_SLUG: Record<string, string> = {
      '': 'HOME',
      'ob-avtore/': 'ABOUT',
      'metod/': 'METHOD',
      'faq/': 'FAQ',
      'kontakty/': 'CONTACTS',
      'politika-konfidentsialnosti/': 'PRIVACY',
      'disclaimer/': 'DISCLAIMER',
      'tseny/': 'PRICING',
    }
    for (const page of STATIC_PAGES) {
      const ruUrl = `${BASE}/ru/${page.slug}`
      let lastMod: Date | undefined
      if (page.slug === 'uslugi/') {
        lastMod = maxServiceMod
      } else if (page.slug === 'blog/') {
        lastMod = maxPostMod ? new Date(maxPostMod) : undefined
      } else {
        const type = PAGE_TYPE_BY_SLUG[page.slug]
        const mod = type ? pageMods[type] : undefined
        lastMod = mod ? new Date(mod) : undefined
      }
      if (page.slug === 'tseny/') {
        addPair(entries, ruUrl, `${BASE}/uk/tsiny/`, page.priority, page.changefreq, lastMod)
      } else if (page.slug === 'ob-avtore/') {
        addPair(entries, ruUrl, `${BASE}/uk/pro-avtora/`, page.priority, page.changefreq, lastMod)
      } else {
        addPair(entries, ruUrl, `${BASE}/uk/${page.slug}`, page.priority, page.changefreq, lastMod)
      }
    }

    if (ruServices && ruServices.length > 0) {
      const ukList = ukServices ?? []
      for (const ru of ruServices) {
        const uk = ukList.find((s) => s.id === ru.id)
        addPair(
          entries,
          `${BASE}/ru/uslugi/${ru.translation.slug}/`,
          `${BASE}/uk/uslugi/${uk?.translation.slug ?? ru.translation.slug}/`,
          ru.priority >= 2 ? 0.8 : 0.7,
          'monthly',
          ru.updatedAt,
        )
      }
    } else {
      const servicePriorityMap: Record<number, number> = { 1: 0.8, 2: 0.7, 3: 0.6 }
      for (const service of SERVICES) {
        addPair(
          entries,
          `${BASE}/ru/uslugi/${service.slug}/`,
          `${BASE}/uk/uslugi/${SERVICE_SLUG_UK[service.slug] ?? service.slug}/`,
          servicePriorityMap[service.priority] ?? 0.6,
          'monthly',
          service.updatedAt ? new Date(service.updatedAt) : new Date('2026-07-10'),
        )
      }
    }

    /* ── 3. Статьи блога — лёгкий D1-геттер (без faqJson/excerpt) + fallback ── */
    if (ruPosts && ruPosts.length > 0) {
      const ukList = ukPosts ?? []
      for (const ru of ruPosts) {
        const uk = ukList.find((p) => p.id === ru.id)
        addPair(
          entries,
          `${BASE}/ru/blog/${ru.slug}/`,
          `${BASE}/uk/blog/${uk?.slug ?? ru.slug}/`,
          0.8,
          'weekly',
          ru.updatedAt ? new Date(ru.updatedAt) : ru.publishedAt ? new Date(ru.publishedAt) : undefined,
        )
      }
    } else {
      const blogPosts = getAllBlogPosts()
      for (const post of blogPosts) {
        addPair(
          entries,
          `${BASE}/ru/blog/${post.slug}/`,
          `${BASE}/uk/blog/${BLOG_SLUG_UK[post.slug] ?? post.slug}/`,
          0.8,
          'weekly',
          new Date(post.dateModified ?? post.datePublished),
        )
      }
    }

    /* ── 4. Категории блога — D1 + fallback (страницы индексируются, обязаны быть в sitemap) ── */
    if (ruCats && ruCats.length > 0) {
      const ukList = ukCats ?? []
      for (const ru of ruCats) {
        const uk = ukList.find((c) => c.id === ru.id)
        addPair(
          entries,
          `${BASE}/ru/blog/kategoriya/${ru.translation.slug}/`,
          `${BASE}/uk/blog/kategoriya/${uk?.translation.slug ?? ru.translation.slug}/`,
          0.6,
          'weekly',
          catMods[ru.id] ? new Date(catMods[ru.id]) : undefined,
        )
      }
    } else {
      // No D1: derive category lastmod from the fallback post constants in
      // memory (max dateModified/datePublished per categorySlug).
      const maxPostDateByCat: Record<string, Date> = {}
      for (const post of getAllBlogPosts()) {
        const d = new Date(post.dateModified ?? post.datePublished)
        const cur = maxPostDateByCat[post.categorySlug]
        if (!cur || d > cur) maxPostDateByCat[post.categorySlug] = d
      }
      for (const cat of BLOG_CATEGORIES) {
        addPair(
          entries,
          `${BASE}/ru/blog/kategoriya/${cat.slug}/`,
          `${BASE}/uk/blog/kategoriya/${CATEGORY_SLUG_UK[cat.slug] ?? cat.slug}/`,
          0.6,
          'weekly',
          maxPostDateByCat[cat.slug],
        )
      }
    }

    return entries
  })
}

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function toXml(entries: SitemapEntry[]): string {
  const rows = entries.map((e) => {
    const parts = [`<loc>${esc(e.url)}</loc>`]
    for (const lang of ['ru', 'uk', 'x-default'] as const) {
      parts.push(`<xhtml:link rel="alternate" hreflang="${lang}" href="${esc(e.alternates[lang])}" />`)
    }
    if (e.lastModified) parts.push(`<lastmod>${e.lastModified.toISOString()}</lastmod>`)
    if (e.changeFrequency) parts.push(`<changefreq>${e.changeFrequency}</changefreq>`)
    if (e.priority !== undefined) parts.push(`<priority>${e.priority}</priority>`)
    return `<url>${parts.join('')}</url>`
  })
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    rows.join('\n') +
    '\n</urlset>'
  )
}

export interface SitemapCacheEnv {
  CONTENT_CACHE_KV?: KVNamespace
  CONTENT_CACHE_R2?: R2Bucket
}

export interface SitemapXmlResult {
  xml: string
  /** true when served from the R2 durable snapshot after a rebuild failure. */
  stale: boolean
}

/**
 * Served XML for /sitemap.xml: KV hit → return; miss → rebuild + repopulate
 * (KV put + R2 mirror, both via waitUntil so the response is not delayed and
 * the writes are guaranteed to finish after it); rebuild failure → R2 durable
 * snapshot instead of 500/1102.
 */
export async function getSitemapXml(
  env: SitemapCacheEnv,
  waitUntil?: (promise: Promise<unknown>) => void,
): Promise<SitemapXmlResult> {
  /* 1. KV hit — fast path (1 get, ~1 ms CPU) */
  if (env.CONTENT_CACHE_KV) {
    try {
      const cached = await env.CONTENT_CACHE_KV.get(SITEMAP_XML_KEY, { type: 'text' })
      if (cached !== null) return { xml: cached, stale: false }
    } catch {
      // KV error — fall through to rebuild
    }
  }

  /* 2. Cache miss — rebuild (rare: ≤1/h + after invalidation) and populate */
  try {
    const xml = toXml(await buildEntries())
    const puts: Promise<unknown>[] = []
    if (env.CONTENT_CACHE_KV) {
      puts.push(env.CONTENT_CACHE_KV.put(SITEMAP_XML_KEY, xml, { expirationTtl: SITEMAP_XML_TTL }))
    }
    if (env.CONTENT_CACHE_R2) {
      puts.push(
        env.CONTENT_CACHE_R2.put(R2_SITEMAP_KEY, xml, {
          httpMetadata: { contentType: 'application/xml; charset=utf-8' },
        }),
      )
    }
    if (waitUntil) waitUntil(Promise.allSettled(puts))
    else await Promise.allSettled(puts)
    return { xml, stale: false }
  } catch (buildError) {
    /* 3. Rebuild failed — serve the durable R2 snapshot (stale but alive) */
    if (env.CONTENT_CACHE_R2) {
      try {
        const snapshot = await env.CONTENT_CACHE_R2.get(R2_SITEMAP_KEY)
        if (snapshot) return { xml: await new Response(snapshot.body).text(), stale: true }
      } catch {
        // R2 also failed — surface the original error
      }
    }
    throw buildError
  }
}

/** Targeted invalidation (AGENTS.md §4) — called from /api/revalidate. */
export async function invalidateSitemapXml(env: SitemapCacheEnv): Promise<void> {
  await Promise.allSettled([
    env.CONTENT_CACHE_KV ? env.CONTENT_CACHE_KV.delete(SITEMAP_XML_KEY) : Promise.resolve(),
    env.CONTENT_CACHE_R2 ? env.CONTENT_CACHE_R2.delete(R2_SITEMAP_KEY) : Promise.resolve(),
  ])
}

/**
 * Warm-up after invalidation (and on cron): rebuild and repopulate so the
 * first request after a publish is a KV hit, never a heavy render at peak
 * traffic. Shared by /api/revalidate and the scheduled warm.
 */
export async function warmSitemapXml(env: SitemapCacheEnv): Promise<void> {
  const xml = toXml(await buildEntries())
  await Promise.allSettled([
    env.CONTENT_CACHE_KV ? env.CONTENT_CACHE_KV.put(SITEMAP_XML_KEY, xml, { expirationTtl: SITEMAP_XML_TTL }) : Promise.resolve(),
    env.CONTENT_CACHE_R2
      ? env.CONTENT_CACHE_R2.put(R2_SITEMAP_KEY, xml, {
          httpMetadata: { contentType: 'application/xml; charset=utf-8' },
        })
      : Promise.resolve(),
  ])
}
