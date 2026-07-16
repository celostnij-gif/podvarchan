import type { MetadataRoute } from 'next'
import { SITE, SERVICES, STATIC_PAGES } from '@/constants'
import { getAllBlogPosts, getPublishedServices, getPublishedBlogPosts } from '@/lib/content'
import { SERVICE_SLUG_UK, BLOG_SLUG_UK } from '@/lib/slugMapping'

const BASE = SITE.url

/**
 * Вспомогательная функция для генерации пары локализованных записей (ru и uk).
 * Next.js автоматически превратит объект `alternates.languages` в теги <xhtml:link>
 */
function makeLocalized(
  path: string,
  priority: number,
  changefreq: MetadataRoute.Sitemap[number]['changeFrequency'],
  lastModified?: Date
): [MetadataRoute.Sitemap[number], MetadataRoute.Sitemap[number]] {
  // Paths always include trailing slash — consistent with trailingSlash:true in next.config
  const cleanPath = path
  
  const ruUrl = `${BASE}/ru${cleanPath}`
  const ukUrl = `${BASE}/uk${cleanPath}`
  const date = lastModified ?? new Date()

  // Общий объект альтернатив для обеих страниц согласно требованиям поисковых систем
  const languagesAlternates = {
    ru: ruUrl,
    uk: ukUrl,
    'x-default': ruUrl, // Русский язык выбран в качестве дефолтного по ТЗ
  }

  const ru: MetadataRoute.Sitemap[number] = {
    url: ruUrl,
    lastModified: date,
    changeFrequency: changefreq,
    priority,
    alternates: {
      languages: languagesAlternates,
    },
  }

  const uk: MetadataRoute.Sitemap[number] = {
    url: ukUrl,
    lastModified: date,
    changeFrequency: changefreq,
    priority,
    alternates: {
      languages: languagesAlternates,
    },
  }

  return [ru, uk]
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []

  /* ── 1. Статические страницы ── */
  for (const page of STATIC_PAGES) {
    const [ru, uk] = makeLocalized(`/${page.slug}`, page.priority, page.changefreq)
    entries.push(ru, uk)
  }

  
  /* ── 2. Услуги — D1 + fallback на константы ── */
  try {
    const fromDb = await getPublishedServices('ru')
    if (!fromDb || fromDb.length === 0) throw new Error('no data')
    const ukServices = await getPublishedServices('uk').catch(() => null)
    for (const service of fromDb) {
      const [ruEntry, ukEntry] = makeLocalized(
        `/uslugi/${service.translation.slug}/`,
        service.priority >= 2 ? 0.8 : 0.7,
        'monthly',
        service.updatedAt ?? undefined,
      )
      entries.push(ruEntry)
      const ukSlug = ukServices?.find(s => s.id === service.id)?.translation.slug
      if (ukSlug && ukSlug !== service.translation.slug) {
        const ukEntries = makeLocalized(`/uslugi/${ukSlug}/`, service.priority >= 2 ? 0.8 : 0.7, 'monthly', service.updatedAt ?? undefined)
        entries.push(ukEntries[1])
      } else {
        entries.push(ukEntry)
      }
    }
  } catch {
    const servicePriorityMap: Record<number, number> = { 1: 0.8, 2: 0.7, 3: 0.6 }
    for (const service of SERVICES) {
      const priority = servicePriorityMap[service.priority] ?? 0.6
      const ruUrl = `${BASE}/ru/uslugi/${service.slug}/`
      const ukSlug = SERVICE_SLUG_UK[service.slug] ?? service.slug
      const ukUrl = `${BASE}/uk/uslugi/${ukSlug}/`
      const date = service.updatedAt ? new Date(service.updatedAt) : new Date('2026-07-10')
      const alternates = { ru: ruUrl, uk: ukUrl }
      entries.push({ url: ruUrl, alternates: { languages: alternates }, priority, changeFrequency: 'monthly', lastModified: date })
      entries.push({ url: ukUrl, alternates: { languages: alternates }, priority, changeFrequency: 'monthly', lastModified: date })
    }
  }


  /* ── 4. Статьи блога — D1 + fallback ── */
  try {
    const postsRu = await getPublishedBlogPosts('ru')
    if (!postsRu || postsRu.length === 0) throw new Error('no data')
    for (const post of postsRu) {
      const modDate = post.updatedAt ?? post.publishedAt ?? new Date()
      const [ru, uk] = makeLocalized(`/blog/${post.translation.slug}/`, 0.8, 'weekly', modDate)
      entries.push(ru, uk)
    }
  } catch {
    const blogPosts = getAllBlogPosts()
    for (const post of blogPosts) {
      const modDate = new Date(post.dateModified ?? post.datePublished)
      const ruUrl = `${BASE}/ru/blog/${post.slug}/`
      const ukSlug = BLOG_SLUG_UK[post.slug] ?? post.slug
      const ukUrl = `${BASE}/uk/blog/${ukSlug}/`
      const alternates = { ru: ruUrl, uk: ukUrl }
      entries.push({ url: ruUrl, alternates: { languages: alternates }, priority: 0.8, changeFrequency: 'weekly', lastModified: modDate })
      entries.push({ url: ukUrl, alternates: { languages: alternates }, priority: 0.8, changeFrequency: 'weekly', lastModified: modDate })
    }
  }

  return entries
}
