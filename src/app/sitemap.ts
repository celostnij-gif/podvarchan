import type { MetadataRoute } from 'next'
import { SITE, SERVICES, BLOG_CATEGORIES, STATIC_PAGES } from '@/constants'

const BASE = SITE.url

/**
 * Динамическая генерация sitemap.xml с поддержкой локалей (ru/uk).
 * localePrefix: 'always' — обе локали имеют префикс в URL.
 */

function makeLocalized(
  path: string,
  priority: number,
  changefreq: MetadataRoute.Sitemap[number]['changeFrequency']
): [MetadataRoute.Sitemap[number], MetadataRoute.Sitemap[number]] {
  const cleanPath = path === '/' ? '' : path
  const ruUrl = `${BASE}/ru${cleanPath}`
  const ukUrl = `${BASE}/uk${cleanPath}`

  const ru: MetadataRoute.Sitemap[number] = {
    url: ruUrl,
    lastModified: new Date(),
    changeFrequency: changefreq,
    priority,
    alternates: {
      languages: {
        ru: ruUrl,
        uk: ukUrl,
        'x-default': ruUrl,
      },
    },
  }

  const uk: MetadataRoute.Sitemap[number] = {
    url: ukUrl,
    lastModified: new Date(),
    changeFrequency: changefreq,
    priority,
    alternates: {
      languages: {
        ru: ruUrl,
        uk: ukUrl,
        'x-default': ruUrl,
      },
    },
  }

  return [ru, uk]
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  /* ── Статические страницы ── */
  for (const page of STATIC_PAGES) {
    const [ru, uk] = makeLocalized(`/${page.slug}`, page.priority, page.changefreq)
    entries.push(ru, uk)
  }

  /* ── Страницы услуг ── */
  const servicePriorityMap: Record<number, number> = { 1: 0.8, 2: 0.7, 3: 0.6 }

  for (const service of SERVICES) {
    const priority = servicePriorityMap[service.priority] ?? 0.6
    const [ru, uk] = makeLocalized(`/uslugi/${service.slug}/`, priority, 'monthly')
    entries.push(ru, uk)
  }

  /* ── Категории блога ── */
  for (const category of BLOG_CATEGORIES) {
    const [ru, uk] = makeLocalized(`/blog/kategoriya/${category.slug}/`, 0.6, 'weekly')
    entries.push(ru, uk)
  }

  return entries
}
