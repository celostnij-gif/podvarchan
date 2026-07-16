/**
 * Public D1 query helpers for the public-facing site.
 *
 * Runtime (ISR/SSR) only. Prefer SQL filters + .get() / LIMIT — never load-all + find.
 * When D1 is unavailable (build-time), calls throw — handle at the page level with fallback.
 *
 * Free plan: keep each cache-miss path to 1–3 cheap queries (see AGENT.md §2).
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
import { mediaAssets } from '@/db/schema/media'
import { testimonials, testimonialTranslations } from '@/db/schema/testimonials'
import {
  navigationItems,
  contactChannels,
  siteSettings,
} from '@/db/schema/settings'

// ─── Limits (safety vs Free CPU / payload) ───

const LIMIT_SERVICES = 50
const LIMIT_BLOG_POSTS = 100
const LIMIT_BLOG_CATEGORIES = 50
const LIMIT_FAQ = 50
const LIMIT_PAGE_SECTIONS = 40

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
  /** Full HTML — set only on detail helpers; list helpers leave null */
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

export interface TestimonialPublic {
  id: string
  name: string | null
  city: string | null
  text: string | null
  result: string | null
  rating: number | null
  publishedAt: string | null
}

export interface NavItemPublic {
  id: string
  href: string | null
  label: string
  children?: NavItemPublic[]
}

export interface ContactChannelPublic {
  id: string
  type: string
  label: string | null
  value: string | null
  url: string | null
  isPrimary: boolean
}

// ─── Services ───

function mapServiceRow(r: {
  services: typeof services.$inferSelect
  service_translations: typeof serviceTranslations.$inferSelect
}): ServicePublic {
  return {
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
  }
}

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
    .limit(LIMIT_SERVICES)
    .all()

  return rows.map(mapServiceRow)
}

/** Single service by translation slug — no full-table scan. */
export async function getServiceBySlug(
  slug: string,
  locale: string,
): Promise<ServicePublic | null> {
  const db = getDB()
  const loc = locale as 'ru' | 'uk'
  const row = await db
    .select()
    .from(services)
    .innerJoin(serviceTranslations, eq(services.id, serviceTranslations.serviceId))
    .where(
      and(
        eq(services.status, 'PUBLISHED'),
        eq(serviceTranslations.locale, loc),
        eq(serviceTranslations.slug, slug),
      ),
    )
    .get()

  return row ? mapServiceRow(row) : null
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
    .limit(LIMIT_BLOG_CATEGORIES)
    .all()

  return rows.map((r) => ({
    id: r.blog_categories.id,
    slug: r.blog_category_translations.slug,
    name: r.blog_category_translations.name,
    description: r.blog_category_translations.description,
  }))
}

// ─── Blog posts ───

type BlogJoinRow = {
  blog_posts: typeof blogPosts.$inferSelect
  blog_post_translations: typeof blogPostTranslations.$inferSelect
  blog_categories: typeof blogCategories.$inferSelect | null
  blog_category_translations: typeof blogCategoryTranslations.$inferSelect | null
}

function mapBlogListRow(r: BlogJoinRow): BlogPostPublic {
  return {
    id: r.blog_posts.id,
    slug: r.blog_post_translations.slug,
    title: r.blog_post_translations.title,
    excerpt: r.blog_post_translations.excerpt,
    contentHtml: null,
    categoryId: r.blog_posts.categoryId,
    categorySlug: r.blog_category_translations?.slug ?? null,
    categoryName: r.blog_category_translations?.name ?? null,
    coverImageId: r.blog_posts.coverImageId,
    readingMinutes: r.blog_posts.readingMinutes,
    publishedAt: r.blog_posts.publishedAt,
    updatedAt: r.blog_posts.updatedAt,
    faqJson: r.blog_post_translations.faqJson,
  }
}

function mapBlogDetailRow(r: BlogJoinRow): BlogPostPublic {
  return {
    ...mapBlogListRow(r),
    contentHtml: r.blog_post_translations.contentHtml,
  }
}

/** Published posts for lists/sitemap — without contentHtml (CPU/payload). */
export async function getBlogPosts(locale: string): Promise<BlogPostPublic[]> {
  const db = getDB()
  const loc = locale as 'ru' | 'uk'
  const rows = await db
    .select({
      blog_posts: blogPosts,
      blog_post_translations: blogPostTranslations,
      blog_categories: blogCategories,
      blog_category_translations: blogCategoryTranslations,
    })
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
    .limit(LIMIT_BLOG_POSTS)
    .all()

  return rows.map((r) =>
    mapBlogListRow({
      blog_posts: r.blog_posts,
      blog_post_translations: r.blog_post_translations,
      blog_categories: r.blog_categories,
      blog_category_translations: r.blog_category_translations,
    }),
  )
}

/** Single post by translation slug — includes contentHtml. */
export async function getBlogPostBySlug(
  slug: string,
  locale: string,
): Promise<BlogPostPublic | null> {
  const db = getDB()
  const loc = locale as 'ru' | 'uk'
  const row = await db
    .select({
      blog_posts: blogPosts,
      blog_post_translations: blogPostTranslations,
      blog_categories: blogCategories,
      blog_category_translations: blogCategoryTranslations,
    })
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
        eq(blogPostTranslations.slug, slug),
      ),
    )
    .get()

  if (!row) return null
  return mapBlogDetailRow({
    blog_posts: row.blog_posts,
    blog_post_translations: row.blog_post_translations,
    blog_categories: row.blog_categories,
    blog_category_translations: row.blog_category_translations,
  })
}

/** Posts in a category by category translation slug — list shape (no HTML body). */
export async function getBlogPostsByCategory(
  categorySlug: string,
  locale: string,
): Promise<BlogPostPublic[]> {
  const db = getDB()
  const loc = locale as 'ru' | 'uk'
  const rows = await db
    .select({
      blog_posts: blogPosts,
      blog_post_translations: blogPostTranslations,
      blog_categories: blogCategories,
      blog_category_translations: blogCategoryTranslations,
    })
    .from(blogPosts)
    .innerJoin(
      blogPostTranslations,
      eq(blogPosts.id, blogPostTranslations.postId),
    )
    .innerJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
    .innerJoin(
      blogCategoryTranslations,
      and(
        eq(blogCategories.id, blogCategoryTranslations.categoryId),
        eq(blogCategoryTranslations.locale, loc),
        eq(blogCategoryTranslations.slug, categorySlug),
      ),
    )
    .where(
      and(
        eq(blogPosts.status, 'PUBLISHED'),
        eq(blogPostTranslations.locale, loc),
      ),
    )
    .orderBy(desc(blogPosts.publishedAt))
    .limit(LIMIT_BLOG_POSTS)
    .all()

  return rows.map((r) =>
    mapBlogListRow({
      blog_posts: r.blog_posts,
      blog_post_translations: r.blog_post_translations,
      blog_categories: r.blog_categories,
      blog_category_translations: r.blog_category_translations,
    }),
  )
}

// ─── Pages ───

export async function getPageByType(
  type:
    | 'HOME'
    | 'METHOD'
    | 'ABOUT'
    | 'FAQ'
    | 'CONTACTS'
    | 'PRIVACY'
    | 'DISCLAIMER'
    | 'PRICING'
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
      and(
        eq(pageSections.id, pageSectionTranslations.sectionId),
        eq(pageSectionTranslations.locale, loc),
      ),
    )
    .where(
      and(eq(pageSections.pageId, row.pages.id), eq(pageSections.enabled, true)),
    )
    .orderBy(pageSections.sortOrder)
    .limit(LIMIT_PAGE_SECTIONS)
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

// ─── FAQ ───

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
        ...(group
          ? [eq(faqItems.group, group as 'HOME' | 'GENERAL' | 'SERVICE' | 'CONTACTS')]
          : []),
      ),
    )
    .orderBy(faqItems.sortOrder)
    .limit(LIMIT_FAQ)
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

// ─── Media ───

/**
 * Resolve media id or pass-through absolute/relative URL.
 * One cheap .get() — do not call in a tight loop over large lists.
 */
export async function getMediaPublicUrl(idOrUrl: string): Promise<string | null> {
  if (!idOrUrl) return null
  if (idOrUrl.startsWith('/') || idOrUrl.startsWith('http://') || idOrUrl.startsWith('https://')) {
    return idOrUrl
  }

  const db = getDB()
  const row = await db
    .select({ publicUrl: mediaAssets.publicUrl })
    .from(mediaAssets)
    .where(eq(mediaAssets.id, idOrUrl))
    .get()

  return row?.publicUrl ?? null
}

/**
 * Resolve media id to URL + variants for ResponsiveImage.
 * Returns null if not found / pass-through if already a URL.
 */
export interface MediaWithVariants {
  url: string
  variants?: { width: number; url: string }[]
}

export async function getMediaWithVariants(idOrUrl: string): Promise<MediaWithVariants | null> {
  if (!idOrUrl) return null
  if (idOrUrl.startsWith('/') || idOrUrl.startsWith('http://') || idOrUrl.startsWith('https://')) {
    return { url: idOrUrl }
  }

  const db = getDB()
  const row = await db
    .select({ publicUrl: mediaAssets.publicUrl, variantsJson: mediaAssets.variantsJson })
    .from(mediaAssets)
    .where(eq(mediaAssets.id, idOrUrl))
    .get()

  if (!row?.publicUrl) return null

  const result: MediaWithVariants = { url: row.publicUrl }
  if (row.variantsJson) {
    try {
      result.variants = JSON.parse(row.variantsJson)
    } catch { /* ignore malformed JSON */ }
  }
  return result
}


// ─── Testimonials ───

/**
 * Published testimonials with consent, ordered by sortOrder.
 * Returns max 20 items with locale-specific text.
 */
export async function getTestimonials(locale: string): Promise<TestimonialPublic[]> {
  const db = getDB()
  const loc = locale as 'ru' | 'uk'
  const rows = await db
    .select({
      id: testimonials.id,
      name: testimonials.clientName,
      text: testimonialTranslations.text,
      result: testimonialTranslations.result,
      rating: testimonials.rating,
      publishedAt: testimonials.publishedAt,
    })
    .from(testimonials)
    .leftJoin(
      testimonialTranslations,
      and(
        eq(testimonials.id, testimonialTranslations.testimonialId),
        eq(testimonialTranslations.locale, loc),
      ),
    )
    .where(
      and(
        eq(testimonials.status, 'PUBLISHED'),
        eq(testimonials.consentConfirmed, true),
      ),
    )
    .orderBy(testimonials.sortOrder)
    .limit(20)

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    city: null,
    text: r.text,
    result: r.result,
    rating: r.rating,
    publishedAt: r.publishedAt,
  }))
}

// ─── Navigation ───

/**
 * Enabled navigation items for a location, ordered by sortOrder.
 * Children are nested under parent items (single level).
 */
export async function getNavigation(
  location: 'HEADER' | 'FOOTER' | 'MOBILE',
  locale: string,
): Promise<NavItemPublic[]> {
  const db = getDB()
  const rows = await db
    .select()
    .from(navigationItems)
    .where(
      and(
        eq(navigationItems.location, location),
        eq(navigationItems.isEnabled, true),
      ),
    )
    .orderBy(navigationItems.sortOrder)
    .limit(40)

  // Resolve label by locale
  const parents = rows.filter(r => !r.parentId)
  const children = rows.filter(r => r.parentId)

  return parents.map(p => {
    const label = locale === 'uk' && p.labelUk ? p.labelUk : (p.labelRu ?? p.labelUk ?? '')
    const item: NavItemPublic = { id: p.id, href: p.href, label }
    const kids = children
      .filter(c => c.parentId === p.id)
      .map(c => ({
        id: c.id,
        href: c.href,
        label: locale === 'uk' && c.labelUk ? c.labelUk : (c.labelRu ?? c.labelUk ?? ''),
      }))
    if (kids.length > 0) item.children = kids
    return item
  })
}

// ─── Contact Channels ───

/**
 * Enabled contact channels ordered by sortOrder.
 */
export async function getContactChannels(): Promise<ContactChannelPublic[]> {
  const db = getDB()
  const rows = await db
    .select()
    .from(contactChannels)
    .where(eq(contactChannels.isEnabled, true))
    .orderBy(contactChannels.sortOrder)
  return rows.map(r => ({
    id: r.id,
    type: r.type,
    label: r.label,
    value: r.value,
    url: r.url,
    isPrimary: r.isPrimary,
  }))

}

// ─── Site Settings ───

/**
 * Get a single site setting by key, returns parsed value or null.
 */
export async function getSiteSetting(key: string): Promise<unknown | null> {
  const db = getDB()
  const row = await db
    .select({ valueJson: siteSettings.valueJson })
    .from(siteSettings)
    .where(eq(siteSettings.key, key))
    .get()

  if (!row?.valueJson) return null
  try {
    return JSON.parse(row.valueJson)
  } catch {
    return null
  }
}