import type { MetadataRoute } from 'next'
import { SITE, SERVICES, BLOG_CATEGORIES, STATIC_PAGES } from '@/constants'
import { getAllBlogPosts } from '@/lib/content'

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
  
  // Убираем лишние слэши для корня сайта
  const cleanPath = path === '/' ? '' : path
  
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

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  /* ── 1. Статические страницы ── */
  for (const page of STATIC_PAGES) {
    const [ru, uk] = makeLocalized(`/${page.slug}`, page.priority, page.changefreq)
    entries.push(ru, uk)
  }

  /* ── 2. Страницы услуг ── */
  const servicePriorityMap: Record<number, number> = { 1: 0.8, 2: 0.7, 3: 0.6 }

  for (const service of SERVICES) {
    const priority = servicePriorityMap[service.priority] ?? 0.6
    const [ru, uk] = makeLocalized(`/uslugi/${service.slug}/`, priority, 'monthly')
    entries.push(ru, uk)
  }

  /* ── 3. Категории блога ── */
  for (const category of BLOG_CATEGORIES) {
    const [ru, uk] = makeLocalized(`/blog/kategoriya/${category.slug}/`, 0.6, 'weekly')
    entries.push(ru, uk)
  }

  /* ── 4. Статьи блога ── */
  const blogPosts = getAllBlogPosts()
  for (const post of blogPosts) {
    const modDate = new Date(post.dateModified ?? post.datePublished)
    const [ru, uk] = makeLocalized(`/blog/${post.slug}/`, 0.8, 'weekly', modDate)
    entries.push(ru, uk)
  }

  return entries
}
