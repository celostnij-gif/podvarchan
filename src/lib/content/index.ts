/**
 * Read-only content layer для публічного сайту.
 *
 * Містить два шари:
 * 1. Sync-функції — працюють зі статичними даними (src/content/blog/, messages/*.json)
 * 2. Async-функції — працюють з D1 через Cloudflare
 *
 * Sync-функції використовуються для поточної версії сайту на статичному контенті.
 * Async-функції використовуються в адмін-панелі та при переході на D1.
 */

import { BLOG_POSTS, BLOG_POST_METAS } from '@/content/blog'
import type { BlogPost } from '@/types'

import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getDb } from '@/db'
import { eq, and, asc } from 'drizzle-orm'
import * as s from '@/db/schema'

/* ── Types ── */

type Db = ReturnType<typeof getDb>

/* ── Internal: get db ── */

function getContentDb(): Db | null {
  try {
    const ctx = getCloudflareContext()
    const binding = (ctx.env as unknown as Record<string, unknown>).DB as D1Database | undefined
    if (!binding) return null
    return getDb(binding)
  } catch {
    return null
  }
}

/* ═══════════════════════════════════════
   Services
   ═══════════════════════════════════════ */

export async function getPublishedServices(locale: string = 'ru') {
  const db = getContentDb()
  if (!db) return []

  const rows = await db
    .select()
    .from(s.services)
    .where(eq(s.services.status, 'PUBLISHED'))
    .orderBy(asc(s.services.sortOrder))

  const result = []
  for (const row of rows) {
    const [translation] = await db
      .select()
      .from(s.serviceTranslations)
      .where(and(
        eq(s.serviceTranslations.serviceId, row.id),
        eq(s.serviceTranslations.locale, locale as 'ru' | 'uk'),
      ))
      .limit(1)

    if (translation) {
      result.push({
        id: row.id,
        slugBase: row.slugBase,
        icon: row.icon,
        category: row.category,
        priority: row.priority,
        featured: row.featured,
        status: row.status,
        sortOrder: row.sortOrder,
        publishedAt: row.publishedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        translation,
      })
    }
  }

  return result
}

export async function getServiceBySlug(slug: string, locale: string = 'ru') {
  const db = getContentDb()
  if (!db) return null

  const [translation] = await db
    .select()
    .from(s.serviceTranslations)
    .where(and(
      eq(s.serviceTranslations.slug, slug),
        eq(s.serviceTranslations.locale, locale as 'ru' | 'uk'),
    ))
    .limit(1)

  if (!translation) return null

  const [service] = await db
    .select()
    .from(s.services)
    .where(and(
      eq(s.services.id, translation.serviceId),
      eq(s.services.status, 'PUBLISHED'),
    ))
    .limit(1)

  if (!service) return null

  return { ...service, translation }
}

/* ═══════════════════════════════════════
   Blog
   ═══════════════════════════════════════ */

export async function getPublishedBlogPosts(locale: string = 'ru') {
  const db = getContentDb()
  if (!db) return []

  const posts = await db
    .select()
    .from(s.blogPosts)
    .where(eq(s.blogPosts.status, 'PUBLISHED'))
    .orderBy(asc(s.blogPosts.publishedAt))

  const result = []
  for (const post of posts) {
    const [translation] = await db
      .select()
      .from(s.blogPostTranslations)
      .where(and(
        eq(s.blogPostTranslations.postId, post.id),
        eq(s.blogPostTranslations.locale, locale as 'ru' | 'uk'),
      ))
      .limit(1)

    if (translation) {
      let categoryName: string | null = null
      if (post.categoryId) {
        const [catTrans] = await db
          .select()
          .from(s.blogCategoryTranslations)
          .where(and(
            eq(s.blogCategoryTranslations.categoryId, post.categoryId),
            eq(s.blogCategoryTranslations.locale, locale as 'ru' | 'uk'),
          ))
          .limit(1)
        categoryName = catTrans?.name ?? null
      }

      result.push({ ...post, translation, categoryName })
    }
  }

  return result
}

export async function getBlogPostBySlug(slug: string, locale: string = 'ru') {
  const db = getContentDb()
  if (!db) return null

  const [translation] = await db
    .select()
    .from(s.blogPostTranslations)
    .where(and(
      eq(s.blogPostTranslations.slug, slug),
      eq(s.blogPostTranslations.locale, locale as 'ru' | 'uk'),
    ))
    .limit(1)

  if (!translation) return null

  const [post] = await db
    .select()
    .from(s.blogPosts)
    .where(and(
      eq(s.blogPosts.id, translation.postId),
      eq(s.blogPosts.status, 'PUBLISHED'),
    ))
    .limit(1)

  if (!post) return null

  return { ...post, translation }
}

/* ═══════════════════════════════════════
   Pages
   ═══════════════════════════════════════ */

export async function getPublishedPage(type: string, locale: string = 'ru') {
  const db = getContentDb()
  if (!db) return null

  const [page] = await db
    .select()
    .from(s.pages)
    .where(and(
      eq(s.pages.type, type as 'HOME' | 'METHOD' | 'ABOUT' | 'FAQ' | 'CONTACTS' | 'PRIVACY' | 'DISCLAIMER' | 'PRICING' | 'CUSTOM'),
      eq(s.pages.status, 'PUBLISHED'),
    ))
    .limit(1)

  if (!page) return null

  const [translation] = await db
    .select()
    .from(s.pageTranslations)
    .where(and(
      eq(s.pageTranslations.pageId, page.id),
        eq(s.pageTranslations.locale, locale as 'ru' | 'uk'),
    ))
    .limit(1)

  const sections = await db
    .select()
    .from(s.pageSections)      .where(and(
        eq(s.pageSections.pageId, page.id),
        eq(s.pageSections.enabled, true as never),
      ))
    .orderBy(asc(s.pageSections.sortOrder))

  return { ...page, translation: translation ?? null, sections }
}

/* ═══════════════════════════════════════
   FAQ
   ═══════════════════════════════════════ */

export async function getPublishedFaq(locale: string = 'ru') {
  const db = getContentDb()
  if (!db) return []

  const items = await db
    .select()
    .from(s.faqItems)
    .where(eq(s.faqItems.status, 'PUBLISHED'))
    .orderBy(asc(s.faqItems.sortOrder))

  const result = []
  for (const item of items) {
    const [translation] = await db
      .select()
      .from(s.faqItemTranslations)
      .where(and(
        eq(s.faqItemTranslations.faqItemId, item.id),
        eq(s.faqItemTranslations.locale, locale as 'ru' | 'uk'),
      ))
      .limit(1)

    if (translation) {
      result.push({ ...item, translation })
    }
  }

  return result
}

/* ═══════════════════════════════════════
   Testimonials
   ═══════════════════════════════════════ */

export async function getPublishedTestimonials(locale: string = 'ru') {
  const db = getContentDb()
  if (!db) return []

  const items = await db
    .select()
    .from(s.testimonials)
    .where(eq(s.testimonials.status, 'PUBLISHED'))
    .orderBy(asc(s.testimonials.sortOrder))

  const result = []
  for (const item of items) {
    const [translation] = await db
      .select()
      .from(s.testimonialTranslations)
      .where(and(
        eq(s.testimonialTranslations.testimonialId, item.id),
        eq(s.testimonialTranslations.locale, locale as 'ru' | 'uk'),
      ))
      .limit(1)

    if (translation) {
      result.push({ ...item, translation })
    }
  }

  return result
}

/* ═══════════════════════════════════════
   SYNC LAYER — статичні дані
   ═══════════════════════════════════════ */

/** Форматує дату в людський формат */
export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Повертає всі slug-и блог-постів */
export function getAllBlogSlugs(): string[] {
  return BLOG_POSTS.map((p) => p.slug)
}

/** Повертає блог-пост за slug (з body) */
export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug)
}

/** Повертає всі блог-пости (з body) */
export function getAllBlogPosts(): BlogPost[] {
  return BLOG_POSTS
}

/** Повертає мета-дані всіх постів (без body) */
export function getAllBlogPostMetas(): Omit<BlogPost, 'body'>[] {
  return BLOG_POST_METAS
}

/** Повертає пости за категорією */
export function getBlogPostsByCategory(categorySlug: string): BlogPost[] {
  return BLOG_POSTS.filter((p) => p.categorySlug === categorySlug)
}
