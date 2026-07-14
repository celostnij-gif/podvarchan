/**
 * Public D1 query helpers for the public-facing site.
 *
 * These functions are used in page components at RUNTIME (ISR/SSR).
 * generateStaticParams still uses constants (build-time safe).
 *
 * When D1 is unavailable (build-time SSG), calls throw — handle at the page level.
 */
import { eq, and, desc } from 'drizzle-orm'
import { getDB } from '@/db'
import { services, serviceTranslations } from '@/db/schema/services'
import { faqItems, faqItemTranslations } from '@/db/schema/faq'
import {
  blogCategories,
  blogCategoryTranslations,
  blogPosts,
  blogPostTranslations,
} from '@/db/schema/blog'
import { pages, pageTranslations, pageSections, pageSectionTranslations } from '@/db/schema/pages'
import { seoMeta } from '@/db/schema/seo'

// ─── Types ───

export interface ServicePublic {
  id: string
  slug: string
  title: string
  shortTitle: string | null
  description: string | null
  heroTitle: string | null
  heroSubtitle: string | null
  symptomsJson: string | null
  processJson: string | null
  benefitsJson: string | null
  faqJson: string | null
  ctaText: string | null
  icon: string | null
  category: string | null
  priority: number
  featured: boolean
  updatedAt: string | null
}

export interface BlogPostPublic {
  id: string
  slug: string
  title: string | null
  excerpt: string | null
  contentHtml: string | null
  categoryId: string | null
  categorySlug: string | null
  categoryName: string | null
  coverImageId: string | null
  readingMinutes: number | null
  publishedAt: string | null
  updatedAt: string | null
  faqJson: string | null
}

export interface BlogCategoryPublic {
  id: string
  slug: string
  name: string | null
  description: string | null
}

export interface PagePublic {
  id: string
  slug: string
  title: string | null
  excerpt: string | null
  contentJson: string | null
  sections: PageSectionPublic[]
}

export interface PageSectionPublic {
  key: string
  type: string
  contentJson: string | null
  settingsJson: string | null
}

export interface SEOMetaPublic {
  title: string | null
  description: string | null
  keywords: string | null
}

// ─── Services ───
export async function getServices(locale: string): Promise<ServicePublic[]> {
  const db = getDB()
  const loc = locale as 'ru' | 'uk'
  const rows = await db
    .select()
    .from(services)
    .innerJoin(serviceTranslations, eq(services.id, serviceTranslations.serviceId))
    .where(
      and(eq(services.status, 'PUBLISHED'), eq(serviceTranslations.locale, loc)),
    )
    .orderBy(services.sortOrder)
    .all()

  return rows.map((r) => ({
    id: r.services.id,
    slug: r.service_translations.slug,
    title: r.service_translations.title ?? '',
    shortTitle: r.service_translations.shortTitle,
    description: r.service_translations.description,
    heroTitle: r.service_translations.heroTitle,
    heroSubtitle: r.service_translations.heroSubtitle,
    symptomsJson: r.service_translations.symptomsJson,
    processJson: r.service_translations.processJson,
    benefitsJson: r.service_translations.benefitsJson,
    faqJson: r.service_translations.faqJson,
    ctaText: r.service_translations.ctaText,
    icon: r.services.icon,
    category: r.services.category,
    priority: r.services.priority,
    featured: r.services.featured,
    updatedAt: r.services.updatedAt,
  }))
}

export async function getServiceBySlug(
  slug: string,
  locale: string,
): Promise<ServicePublic | null> {
  const list = await getServices(locale)
  return list.find((s) => s.slug === slug) ?? null
}

// ─── Blog categories ───

export async function getBlogCategories(
  locale: string,
): Promise<BlogCategoryPublic[]> {
  const db = getDB()
  const loc = locale as 'ru' | 'uk'
  const rows = await db
    .select()
    .from(blogCategories)
    .innerJoin(
      blogCategoryTranslations,
      eq(blogCategories.id, blogCategoryTranslations.categoryId),
    )
    .where(
      and(
        eq(blogCategories.status, 'PUBLISHED'),
        eq(blogCategoryTranslations.locale, loc),
      ),
    )
    .orderBy(blogCategories.sortOrder)
    .all()

  return rows.map((r) => ({
    id: r.blog_categories.id,
    slug: r.blog_category_translations.slug,
    name: r.blog_category_translations.name,
    description: r.blog_category_translations.description,
  }))
}
export async function getBlogPosts(locale: string): Promise<BlogPostPublic[]> {
  const db = getDB()
  const loc = locale as 'ru' | 'uk'
  const rows = await db
    .select()
    .from(blogPosts)
    .innerJoin(
      blogPostTranslations,
      eq(blogPosts.id, blogPostTranslations.postId),
    )
    .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
    .leftJoin(
      blogCategoryTranslations,
      and(
        eq(blogCategories.id, blogCategoryTranslations.categoryId),
        eq(blogCategoryTranslations.locale, loc),
      ),
    )
    .where(
      and(
        eq(blogPosts.status, 'PUBLISHED'),
        eq(blogPostTranslations.locale, loc),
      ),
    )
    .orderBy(desc(blogPosts.publishedAt))
    .all()

  return rows.map((r) => ({
    id: r.blog_posts.id,
    slug: r.blog_post_translations.slug,
    title: r.blog_post_translations.title,
    excerpt: r.blog_post_translations.excerpt,
    contentHtml: r.blog_post_translations.contentHtml,
    categoryId: r.blog_posts.categoryId,
    categorySlug: r.blog_category_translations?.slug ?? null,
    categoryName: r.blog_category_translations?.name ?? null,
    coverImageId: r.blog_posts.coverImageId,
    readingMinutes: r.blog_posts.readingMinutes,
    publishedAt: r.blog_posts.publishedAt,
    updatedAt: r.blog_posts.updatedAt,
    faqJson: r.blog_post_translations.faqJson,
  }))
}

export async function getBlogPostBySlug(
  slug: string,
  locale: string,
): Promise<BlogPostPublic | null> {
  const list = await getBlogPosts(locale)
  return list.find((p) => p.slug === slug) ?? null
}

export async function getBlogPostsByCategory(
  slug: string,
  locale: string,
): Promise<BlogPostPublic[]> {
  const list = await getBlogPosts(locale)
  return list.filter((p) => p.categorySlug === slug)
}
export async function getPageByType(
  type:
    | 'HOME'
    | 'METHOD'
    | 'ABOUT'
    | 'FAQ'
    | 'CONTACTS'
    | 'PRIVACY'
    | 'DISCLAIMER'
    | 'CUSTOM',
  locale: string,
): Promise<PagePublic | null> {
  const db = getDB()
  const loc = locale as 'ru' | 'uk'
  const row = await db
    .select()
    .from(pages)
    .innerJoin(pageTranslations, eq(pages.id, pageTranslations.pageId))
    .where(
      and(
        eq(pages.type, type),
        eq(pages.status, 'PUBLISHED'),
        eq(pageTranslations.locale, loc),
      ),
    )
    .get()

  if (!row) return null

  const sectionRows = await db
    .select()
    .from(pageSections)
    .leftJoin(
      pageSectionTranslations,
      eq(pageSections.id, pageSectionTranslations.sectionId),
    )
    .where(
      and(eq(pageSections.pageId, row.pages.id), eq(pageSections.enabled, true)),
    )
    .orderBy(pageSections.sortOrder)
    .all()

  const sectionMap = new Map<string, PageSectionPublic>()
  for (const sec of sectionRows) {
    const key = sec.page_sections.key
    if (!sectionMap.has(key)) {
      sectionMap.set(key, {
        key,
        type: sec.page_sections.type,
        contentJson: sec.page_section_translations?.contentJson ?? null,
        settingsJson: sec.page_sections.settingsJson,
      })
    }
  }

  return {
    id: row.pages.id,
    slug: row.page_translations.slug,
    title: row.page_translations.title,
    excerpt: row.page_translations.excerpt,
    contentJson: row.page_translations.contentJson,
    sections: Array.from(sectionMap.values()),
  }
}
// ─── FAQ (from D1 faq_items + faq_item_translations) ───

export interface FAQPublic {
  id: string
  question: string
  answer: string | null
}

export async function getFAQs(locale: string, group?: string): Promise<FAQPublic[]> {
  const db = getDB()
  const loc = locale as 'ru' | 'uk'
  const rows = await db
    .select()
    .from(faqItems)
    .innerJoin(
      faqItemTranslations,
      eq(faqItems.id, faqItemTranslations.faqItemId),
    )
    .where(
      and(
        eq(faqItems.status, 'PUBLISHED'),
        eq(faqItemTranslations.locale, loc),
        ...(group ? [eq(faqItems.group, group as 'HOME' | 'GENERAL' | 'SERVICE' | 'CONTACTS')] : []),
      ),
    )
    .orderBy(faqItems.sortOrder)
    .all()

  return rows.map((r) => ({
    id: r.faq_items.id,
    question: r.faq_item_translations.question ?? '',
    answer: r.faq_item_translations.answer ?? '',
  }))
}

// ─── SEO ───

export async function getSEOMeta(
  entityType: string,
  entityId: string,
  locale: string,
): Promise<SEOMetaPublic | null> {
  const db = getDB()
  const loc = locale as 'ru' | 'uk'
  const row = await db
    .select()
    .from(seoMeta)
    .where(
      and(
        eq(seoMeta.entityType, entityType),
        eq(seoMeta.entityId, entityId),
        eq(seoMeta.locale, loc),
      ),
    )
    .get()

  if (!row) return null
  return {
    title: row.title,
    description: row.description,
    keywords: row.keywords,
  }
}
