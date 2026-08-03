import type { MetadataRoute } from 'next'
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
 * ISR-пересчёт не чаще раза в сутки (владелец: «максимум раз в день»).
 * revalidate — это не фоновый таймер, а верхняя граница: между пересборками
 * отвечает CDN-кеш, воркер не вызывается на каждый запрос. Свежесть при
 * изменении контента обеспечивает on-demand-инвалидация (AGENTS.md §4):
 * админка шлёт /sitemap.xml в путях revalidate → ISR-кеш карты сбрасывается
 * и следующий запрос пересобирает её с живым D1. При билде D1 недоступен
 * (нет Cloudflare-контекста), поэтому артефакт собирается из fallback-констант,
 * а в рантайме воркера карта пересобирается с настоящими данными.
 */
export const revalidate = 86400

type Entry = MetadataRoute.Sitemap[number]
type ChangeFrequency = Entry['changeFrequency']

/** Пара ru/uk с единым объектом alternates (ru + uk + x-default=ru). */
function addPair(
  entries: MetadataRoute.Sitemap,
  ruUrl: string,
  ukUrl: string,
  priority: number,
  changeFrequency: ChangeFrequency,
  lastModified?: Date,
) {
  const languages = { ru: ruUrl, uk: ukUrl, 'x-default': ruUrl }
  const alternates = { languages }
  entries.push({ url: ruUrl, alternates, priority, changeFrequency, lastModified } as Entry)
  entries.push({ url: ukUrl, alternates, priority, changeFrequency, lastModified } as Entry)
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []

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
  try {
    const ruServices = await getPublishedServices('ru')
    if (!ruServices || ruServices.length === 0) throw new Error('no data')
    const ukServices = (await getPublishedServices('uk').catch(() => null)) ?? []
    for (const ru of ruServices) {
      const uk = ukServices.find((s) => s.id === ru.id)
      addPair(
        entries,
        `${BASE}/ru/uslugi/${ru.translation.slug}/`,
        `${BASE}/uk/uslugi/${uk?.translation.slug ?? ru.translation.slug}/`,
        ru.priority >= 2 ? 0.8 : 0.7,
        'monthly',
        ru.updatedAt,
      )
    }
  } catch {
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
  try {
    const ruPosts = await getPublishedBlogPosts('ru')
    if (!ruPosts || ruPosts.length === 0) throw new Error('no data')
    const ukPosts = (await getPublishedBlogPosts('uk').catch(() => null)) ?? []
    for (const ru of ruPosts) {
      const uk = ukPosts.find((p) => p.id === ru.id)
      addPair(
        entries,
        `${BASE}/ru/blog/${ru.translation.slug}/`,
        `${BASE}/uk/blog/${uk?.translation.slug ?? ru.translation.slug}/`,
        0.8,
        'weekly',
        ru.updatedAt ?? ru.publishedAt,
      )
    }
  } catch {
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
  try {
    const ruCats = await getPublishedBlogCategories('ru')
    if (!ruCats || ruCats.length === 0) throw new Error('no data')
    const ukCats = (await getPublishedBlogCategories('uk').catch(() => null)) ?? []
    for (const ru of ruCats) {
      const uk = ukCats.find((c) => c.id === ru.id)
      addPair(
        entries,
        `${BASE}/ru/blog/kategoriya/${ru.translation.slug}/`,
        `${BASE}/uk/blog/kategoriya/${uk?.translation.slug ?? ru.translation.slug}/`,
        0.6,
        'weekly',
      )
    }
  } catch {
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
}
