import { SITE, SERVICES, STATIC_PAGES, BLOG_CATEGORIES } from '@/constants'
import {
  getPublishedServices,
  getPublishedBlogPosts,
  getPublishedBlogCategories,
  getAllBlogPosts,
} from '@/lib/content'
import { SERVICE_SLUG_UK, BLOG_SLUG_UK, CATEGORY_SLUG_UK } from '@/lib/slugMapping'

const BASE = SITE.url

/**
 * /sitemap.xml — route handler, а не metadata-файл `sitemap.ts`:
 * metadata-роуты в OpenNext рендерятся вне request-контекста и не достают D1
 * (сборка/рантайм всегда падают в fallback-константы). Route handler
 * рендерится воркером с живым D1 через withCache (AGENTS.md §3).
 *
 * Свежесть: CDN-кеш s-maxage=3600 (матрица §3) + on-demand-инвалидация —
 * админка при публикациях шлёт /sitemap.xml в путях revalidate, KV-ключи
 * контента (services:list, blog:list, ...) удаляются точечно. Таймеров нет:
 * воркер пересобирает карту только на cache-miss и после инвалидации.
 */
export const dynamic = 'force-dynamic'

/** TTL по AGENTS.md §3: sitemap 3600 / SWR 86400 / SIFE 604800 */


interface SitemapEntry {
  url: string
  lastModified?: Date
  changeFrequency?: string
  priority?: number
  alternates: { ru: string; uk: string; 'x-default': string }
}

const CACHE_CONTROL = 'public, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=604800'

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

  /* ── 1. Статические страницы (tseny/tsiny и ob-avtore/pro-avtora — разные UK-слэги) ── */
  for (const page of STATIC_PAGES) {
    const ruUrl = `${BASE}/ru/${page.slug}`
    if (page.slug === 'tseny/') {
      addPair(entries, ruUrl, `${BASE}/uk/tsiny/`, page.priority, page.changefreq)
    } else if (page.slug === 'ob-avtore/') {
      addPair(entries, ruUrl, `${BASE}/uk/pro-avtora/`, page.priority, page.changefreq)
    } else {
      addPair(entries, ruUrl, `${BASE}/uk/${page.slug}`, page.priority, page.changefreq)
    }
  }

  /* ── 2. Услуги — D1 (свежие данные, пары по id) + fallback на константы ── */
  return Promise.all([
    getPublishedServices('ru').catch(() => null),
    getPublishedServices('uk').catch(() => null),
    getPublishedBlogPosts('ru').catch(() => null),
    getPublishedBlogPosts('uk').catch(() => null),
    getPublishedBlogCategories('ru').catch(() => null),
    getPublishedBlogCategories('uk').catch(() => null),
  ]).then(([ruServices, ukServices, ruPosts, ukPosts, ruCats, ukCats]) => {
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

    /* ── 3. Статьи блога — D1 + fallback ── */
    if (ruPosts && ruPosts.length > 0) {
      const ukList = ukPosts ?? []
      for (const ru of ruPosts) {
        const uk = ukList.find((p) => p.id === ru.id)
        addPair(
          entries,
          `${BASE}/ru/blog/${ru.translation.slug}/`,
          `${BASE}/uk/blog/${uk?.translation.slug ?? ru.translation.slug}/`,
          0.8,
          'weekly',
          ru.updatedAt ?? ru.publishedAt,
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
        )
      }
    } else {
      for (const cat of BLOG_CATEGORIES) {
        addPair(
          entries,
          `${BASE}/ru/blog/kategoriya/${cat.slug}/`,
          `${BASE}/uk/blog/kategoriya/${CATEGORY_SLUG_UK[cat.slug] ?? cat.slug}/`,
          0.6,
          'weekly',
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

function toXml(entries: SitemapEntry[]): string {
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

export async function GET() {
  const entries = await buildEntries()
  return new Response(toXml(entries), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': CACHE_CONTROL,
    },
  })
}
