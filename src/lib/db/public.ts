/**
 * Public D1 query helpers for the public-facing site.
 *
 * Runtime (ISR/SSR) only. Prefer SQL filters + .get() / LIMIT — never load-all + find.
 * When D1 is unavailable (build-time), calls throw — handle at the page level with fallback.
 *
 * Free plan: keep each cache-miss path to 1–3 cheap queries (see AGENT.md §2).
 */
import { eq, and, desc, inArray } from 'drizzle-orm'
import { canPreview, canPreviewList } from '@/lib/preview'
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
import { withCache } from './kv-cache'
import { cacheKeys } from '@podvarchan/shared'

/* ── TTLs (seconds) — AGENTS.md §3 cache matrix ── */
const TTL_NAV = 86400 // navigation_items
const TTL_SETTINGS = 86400 // site_settings
const TTL_CONTACTS = 86400 // contact_channels
const TTL_SERVICES = 21600 // services / service:{slug}
const TTL_FAQ = 21600 // faq:{group}
const TTL_PAGE = 43200 // pages
const TTL_BLOG_CATS = 43200 // blog_categories
const TTL_TESTIMONIALS = 43200 // testimonials
const TTL_BLOG = 3600 // blog_posts list/detail
const TTL_MEDIA = 3600 // media lookups (frequent admin edits)

// ─── Limits (safety vs Free CPU / payload) ───

const LIMIT_SERVICES = 50
const LIMIT_BLOG_POSTS = 100
const LIMIT_BLOG_CATEGORIES = 50
const LIMIT_FAQ = 50
const LIMIT_PAGE_SECTIONS = 40

// ─── Preview (DRAFT access via __preview cookie) ───

/**
 * Check if a preview cookie grants access to a specific entity type + slug.
 * Callers read the cookie themselves (avoids importing next/headers in this module).
 * Returns false if no cookie / invalid token.
 */
async function isPreviewAllowed(
  previewCookie: string | undefined | null,
  entityType: string,
  slug: string,
): Promise<boolean> {
  return canPreview(previewCookie ?? null, entityType, slug)
}

// ─── Types ───

export interface ServicePublic {
  id: string
  slug: string
  title: string
  shortTitle: string | null
  description: string | null
  contentHtml: string | null
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
    contentHtml: r.service_translations.contentHtml,
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

async function getServicesUncached(locale: string): Promise<ServicePublic[]> {
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
export function getServices(locale: string): Promise<ServicePublic[]> {
  return withCache(cacheKeys.servicesList(locale), TTL_SERVICES, () => getServicesUncached(locale))
}
// ─── Service Sidebar (lightweight — only 5 fields for listing/sidebar) ───

export interface ServiceSidebarItem {
  slug: string
  title: string
  shortTitle: string | null
  description: string | null
  ctaText: string | null
}

/** Lightweight service list for sidebar/footer — skips heavy JSON columns (contentHtml, heroTitle, etc.) */
async function getServiceSidebarUncached(locale: string): Promise<ServiceSidebarItem[]> {
  const db = getDB()
  const loc = locale as 'ru' | 'uk'
  const rows = await db
    .select({
      slug: serviceTranslations.slug,
      title: serviceTranslations.title,
      shortTitle: serviceTranslations.shortTitle,
      description: serviceTranslations.description,
      ctaText: serviceTranslations.ctaText,
    })
    .from(services)
    .innerJoin(serviceTranslations, eq(services.id, serviceTranslations.serviceId))
    .where(
      and(eq(services.status, 'PUBLISHED'), eq(serviceTranslations.locale, loc)),
    )
    .orderBy(services.sortOrder)
    .limit(LIMIT_SERVICES)
    .all()

  return rows.map((r) => ({ ...r, title: r.title ?? '' }))
}
export function getServiceSidebar(locale: string): Promise<ServiceSidebarItem[]> {
  return withCache(cacheKeys.servicesSidebar(locale), TTL_SERVICES, () => getServiceSidebarUncached(locale))
}

/** Single service by translation slug — no full-table scan. */
async function getServiceBySlugUncached(
  slug: string,
  locale: string,
  previewCookie?: string,
): Promise<ServicePublic | null> {
  const db = getDB()
  const loc = locale as 'ru' | 'uk'
  const preview = await isPreviewAllowed(previewCookie, 'service', slug)
  const row = await db
    .select()
    .from(services)
    .innerJoin(serviceTranslations, eq(services.id, serviceTranslations.serviceId))
    .where(
      and(
        preview
          ? inArray(services.status, ['PUBLISHED', 'DRAFT'])
          : eq(services.status, 'PUBLISHED'),
        eq(serviceTranslations.locale, loc),
        eq(serviceTranslations.slug, slug),
      ),
    )
    .get()

  return row ? mapServiceRow(row) : null
}
export function getServiceBySlug(
  slug: string,
  locale: string,
  previewCookie?: string,
): Promise<ServicePublic | null> {
  // Preview mode must never read from cache — DRAFT content stays uncached
  if (previewCookie) return getServiceBySlugUncached(slug, locale, previewCookie)
  return withCache(cacheKeys.service(slug, locale), TTL_SERVICES, () => getServiceBySlugUncached(slug, locale))
}
/** Paired-locale lookup by id — for correct hreflang alternates when slugs differ across locales. */
async function getServiceByIdUncached(id: string, locale: string): Promise<ServicePublic | null> {
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
        eq(services.id, id),
      ),
    )
    .get()

  return row ? mapServiceRow(row) : null
}
export function getServiceById(id: string, locale: string): Promise<ServicePublic | null> {
  return withCache(cacheKeys.serviceById(id, locale), TTL_SERVICES, () => getServiceByIdUncached(id, locale))
}

/** Slug → published service in ANY locale — used to 301 a cross-locale slug swap (lang switcher) to the correct URL. */
export async function resolvePublishedServiceSlug(
  slug: string,
): Promise<{ locale: 'ru' | 'uk'; slug: string } | null> {
  const db = getDB()
  const row = await db
    .select({ locale: serviceTranslations.locale, slug: serviceTranslations.slug })
    .from(serviceTranslations)
    .innerJoin(services, eq(services.id, serviceTranslations.serviceId))
    .where(and(eq(serviceTranslations.slug, slug), eq(services.status, 'PUBLISHED')))
    .get()

  if (!row) return null
  return { locale: row.locale as 'ru' | 'uk', slug: row.slug }
}

// ─── Blog categories ───

async function getBlogCategoriesUncached(
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
export function getBlogCategories(locale: string): Promise<BlogCategoryPublic[]> {
  return withCache(cacheKeys.blogCats(locale), TTL_BLOG_CATS, () => getBlogCategoriesUncached(locale))
}


/** Slug → published blog category in ANY locale — used to 301 a cross-locale slug swap (lang switcher) to the correct URL. */

export async function resolvePublishedCategorySlug(
  slug: string,
): Promise<{ locale: 'ru' | 'uk'; slug: string } | null> {
  const db = getDB()
  const row = await db
    .select({ locale: blogCategoryTranslations.locale, slug: blogCategoryTranslations.slug })
    .from(blogCategoryTranslations)
    .innerJoin(blogCategories, eq(blogCategories.id, blogCategoryTranslations.categoryId))
    .where(and(eq(blogCategoryTranslations.slug, slug), eq(blogCategories.status, 'PUBLISHED')))
    .get()

  if (!row) return null
  return { locale: row.locale as 'ru' | 'uk', slug: row.slug }
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
async function getBlogPostsUncached(locale: string): Promise<BlogPostPublic[]> {
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
export function getBlogPosts(locale: string): Promise<BlogPostPublic[]> {
  return withCache(cacheKeys.blogList(locale), TTL_BLOG, () => getBlogPostsUncached(locale))
}

/** Sitemap-only minimal fields (id/slug/updatedAt/publishedAt) — the full
 * blog:list carries faqJson/excerpt/title needed for the /blog page but not
 * for sitemap; parsing ~50 KB per locale on every sitemap render was part of
 * the 1102 failure. Own cache key (blog:list:lite) — invalidation via the
 * blog:list keys' callers already covers it (getBlogPostCacheKeys). */
export type BlogPostLite = {
  id: string
  slug: string
  updatedAt: string | null
  publishedAt: string | null
}

async function getBlogPostsLiteUncached(locale: string): Promise<BlogPostLite[]> {
  const db = getDB()
  const loc = locale as 'ru' | 'uk'
  return db
    .select({
      id: blogPosts.id,
      slug: blogPostTranslations.slug,
      updatedAt: blogPosts.updatedAt,
      publishedAt: blogPosts.publishedAt,
    })
    .from(blogPosts)
    .innerJoin(blogPostTranslations, eq(blogPosts.id, blogPostTranslations.postId))
    .where(
      and(
        eq(blogPosts.status, 'PUBLISHED'),
        eq(blogPostTranslations.locale, loc),
      ),
    )
    .orderBy(desc(blogPosts.publishedAt))
    .limit(LIMIT_BLOG_POSTS)
    .all()
}

export function getBlogPostsLite(locale: string): Promise<BlogPostLite[]> {
  return withCache(cacheKeys.blogListLite(locale), TTL_BLOG, () => getBlogPostsLiteUncached(locale))
}

/** Single post by translation slug — includes contentHtml. */
async function getBlogPostBySlugUncached(
  slug: string,
  locale: string,
  previewCookie?: string,
): Promise<BlogPostPublic | null> {
  const db = getDB()
  const loc = locale as 'ru' | 'uk'
  const preview = await isPreviewAllowed(previewCookie, 'blog_post', slug)
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
        preview
          ? inArray(blogPosts.status, ['PUBLISHED', 'DRAFT'])
          : eq(blogPosts.status, 'PUBLISHED'),
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
export function getBlogPostBySlug(
  slug: string,
  locale: string,
  previewCookie?: string,
): Promise<BlogPostPublic | null> {
  if (previewCookie) return getBlogPostBySlugUncached(slug, locale, previewCookie)
  return withCache(cacheKeys.blogPost(slug, locale), TTL_BLOG, () => getBlogPostBySlugUncached(slug, locale))
}
/** Paired-locale lookup by post id — for correct hreflang alternates when slugs differ across locales. */
async function getBlogPostByIdUncached(id: string, locale: string): Promise<BlogPostPublic | null> {
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
    .innerJoin(blogPostTranslations, eq(blogPosts.id, blogPostTranslations.postId))
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
        eq(blogPosts.id, id),
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
export function getBlogPostById(id: string, locale: string): Promise<BlogPostPublic | null> {
  return withCache(cacheKeys.blogPostById(id, locale), TTL_BLOG, () => getBlogPostByIdUncached(id, locale))
}


/** Slug → published blog post in ANY locale — used to 301 a cross-locale slug swap (lang switcher) to the correct URL. */

export async function resolvePublishedBlogSlug(
  slug: string,
): Promise<{ locale: 'ru' | 'uk'; slug: string } | null> {
  const db = getDB()
  const row = await db
    .select({ locale: blogPostTranslations.locale, slug: blogPostTranslations.slug })
    .from(blogPostTranslations)
    .innerJoin(blogPosts, eq(blogPosts.id, blogPostTranslations.postId))
    .where(and(eq(blogPostTranslations.slug, slug), eq(blogPosts.status, 'PUBLISHED')))
    .get()

  if (!row) return null
  return { locale: row.locale as 'ru' | 'uk', slug: row.slug }
}

/** Posts in a category by category translation slug — list shape (no HTML body). */
async function getBlogPostsByCategoryUncached(
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
export function getBlogPostsByCategory(
  categorySlug: string,
  locale: string,
): Promise<BlogPostPublic[]> {
  return withCache(cacheKeys.blogCatPosts(categorySlug, locale), TTL_BLOG, () => getBlogPostsByCategoryUncached(categorySlug, locale))
}

/** Extract first <img src="..."> from HTML content. */
export function extractFirstImageUrl(html: string): string | null {
  const match = html.match(/<img[^>]+src="([^"]+)"[^>]*>/i)
  return match ? match[1] : null
}

/**
 * Batch fetch first image URL from contentHtml for multiple posts.
 * One query instead of N+1 lookups.
 */
async function getBlogFirstImageUrlsUncached(ids: string[]): Promise<Map<string, string | null>> {
  if (ids.length === 0) return new Map()
  const db = getDB()
  const rows = await db
    .select({
      id: blogPostTranslations.postId,
      contentHtml: blogPostTranslations.contentHtml,
    })
    .from(blogPostTranslations)
    .where(inArray(blogPostTranslations.postId, ids))
    .all()

  const result = new Map<string, string | null>()
  for (const row of rows) {
    if (row.contentHtml) {
      result.set(row.id, extractFirstImageUrl(row.contentHtml))
    }
  }
  return result
}
export async function getBlogFirstImageUrls(ids: string[]): Promise<Map<string, string | null>> {
  if (ids.length === 0) return new Map()
  const key = cacheKeys.blogFirstImages([...ids].sort().join(','))
  const cached = await withCache<Record<string, string | null>>(key, TTL_BLOG, async () => {
    const m = await getBlogFirstImageUrlsUncached(ids)
    return Object.fromEntries(m)
  })
  return new Map(Object.entries(cached))
}

// ─── Pages ───

async function getPageByTypeUncached(
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
  previewCookie?: string,
): Promise<PagePublic | null> {
  const db = getDB()
  const loc = locale as 'ru' | 'uk'
  const preview = await isPreviewAllowed(previewCookie, 'page', type)
  const row = await db
    .select()
    .from(pages)
    .innerJoin(pageTranslations, eq(pages.id, pageTranslations.pageId))
    .where(
      and(
        eq(pages.type, type),
        preview
          ? inArray(pages.status, ['PUBLISHED', 'DRAFT'])
          : eq(pages.status, 'PUBLISHED'),
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
export function getPageByType(
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
  previewCookie?: string,
): Promise<PagePublic | null> {
  if (previewCookie) return getPageByTypeUncached(type, locale, previewCookie)
  return withCache(cacheKeys.page(type, locale), TTL_PAGE, () => getPageByTypeUncached(type, locale))
}

// ─── FAQ ───

export interface FAQPublic {
  id: string
  question: string
  answer: string | null
}

async function getFAQsUncached(
  locale: string,
  group?: string,
  previewCookie?: string | null,
): Promise<FAQPublic[]> {
  const db = getDB()
  const loc = locale as 'ru' | 'uk'
  // Preview: cookie with entityType 'faq_item' (no slug match needed for lists)
  const preview = previewCookie
    ? await canPreviewList(previewCookie, 'faq_item').catch(() => false)
    : false

  const rows = await db
    .select()
    .from(faqItems)
    .innerJoin(
      faqItemTranslations,
      eq(faqItems.id, faqItemTranslations.faqItemId),
    )
    .where(
      and(
        preview ? undefined : eq(faqItems.status, 'PUBLISHED'),
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
export function getFAQs(
  locale: string,
  group?: string,
  previewCookie?: string | null,
): Promise<FAQPublic[]> {
  if (previewCookie) return getFAQsUncached(locale, group, previewCookie)
  return withCache(cacheKeys.faq(group, locale), TTL_FAQ, () => getFAQsUncached(locale, group))
}

// ─── SEO ───

/**
 * Deterministic pick among duplicate seo_meta rows for the same
 * (entity_type, entity_id, locale): oldest created_at wins.
 * Guards against non-deterministic .get() while legacy duplicates exist;
 * after cleanup (plan v3 phase 1b) there should be a single row, but the
 * deterministic pick stays as a regression net.
 */
export function pickSeoMetaWinner<T extends { createdAt: string | null }>(
  rows: readonly T[],
): T | null {
  let best: T | null = null
  for (const row of rows) {
    if (best === null || (row.createdAt ?? '') < (best.createdAt ?? '')) best = row
  }
  return best
}

async function getSEOMetaUncached(
  entityType: string,
  entityId: string,
  locale: string,
): Promise<SEOMetaPublic | null> {
  const db = getDB()
  const loc = locale as 'ru' | 'uk'
  const rows = await db
    .select()
    .from(seoMeta)
    .where(
      and(
        eq(seoMeta.entityType, entityType),
        eq(seoMeta.entityId, entityId),
        eq(seoMeta.locale, loc),
      ),
    )
    .all()

  const row = pickSeoMetaWinner(rows)
  if (!row) return null
  return {
    title: row.title,
    description: row.description,
    keywords: row.keywords,
  }
}
export function getSEOMeta(
  entityType: string,
  entityId: string,
  locale: string,
): Promise<SEOMetaPublic | null> {
  const ttl = entityType === 'blog_post' ? TTL_BLOG : TTL_PAGE
  return withCache(cacheKeys.seo(entityType, entityId, locale), ttl, () => getSEOMetaUncached(entityType, entityId, locale))
}

/**
 * Resolve SEO metadata for a static page type (HOME, METHOD, …) through the
 * page's own id: getPageByType → getSEOMeta. Both reads go through withCache
 * (KV → R2 → D1, AGENTS.md §3). Returns null when the page type has no row
 * (e.g. SERVICES/BLOG are not in `pages`) or D1 is unavailable — callers keep
 * the messages fallback.
 */
export async function getPageSeoMeta(
  pageType: Parameters<typeof getPageByType>[0],
  locale: string,
  previewCookie?: string,
): Promise<SEOMetaPublic | null> {
  const page = await getPageByType(pageType, locale, previewCookie)
  if (!page?.id) return null
  return getSEOMeta('page', page.id, locale)
}

// ─── Media ───

/**
 * Resolve media id or pass-through absolute/relative URL.
 * One cheap .get() — do not call in a tight loop over large lists.
 */
async function getMediaPublicUrlUncached(idOrUrl: string): Promise<string | null> {
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
export function getMediaPublicUrl(idOrUrl: string): Promise<string | null> {
  return withCache(cacheKeys.mediaUrl(idOrUrl), TTL_MEDIA, () => getMediaPublicUrlUncached(idOrUrl))
}

/**
 * Resolve media id to URL + variants for ResponsiveImage.
 * Returns null if not found / pass-through if already a URL.
 */
export interface MediaWithVariants {
  url: string
  variants?: { width: number; url: string }[]
}

async function getMediaWithVariantsUncached(idOrUrl: string): Promise<MediaWithVariants | null> {
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
export function getMediaWithVariants(idOrUrl: string): Promise<MediaWithVariants | null> {
  return withCache(cacheKeys.mediaVariants(idOrUrl), TTL_MEDIA, () => getMediaWithVariantsUncached(idOrUrl))
}


// ─── Testimonials ───

/**
 * Published testimonials with consent, ordered by sortOrder.
 * Returns max 20 items with locale-specific text.
 */
async function getTestimonialsUncached(
  locale: string,
  previewCookie?: string | null,
): Promise<TestimonialPublic[]> {
  const db = getDB()
  const loc = locale as 'ru' | 'uk'
  // Preview: cookie with entityType 'testimonial' (no slug match needed for lists)
  const preview = previewCookie
    ? await canPreviewList(previewCookie, 'testimonial').catch(() => false)
    : false

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
        preview ? undefined : eq(testimonials.status, 'PUBLISHED'),
        preview ? undefined : eq(testimonials.consentConfirmed, true),
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
export function getTestimonials(
  locale: string,
  previewCookie?: string | null,
): Promise<TestimonialPublic[]> {
  if (previewCookie) return getTestimonialsUncached(locale, previewCookie)
  return withCache(cacheKeys.testimonials(locale), TTL_TESTIMONIALS, () => getTestimonialsUncached(locale))
}

// ─── Navigation ───

/**
 * Enabled navigation items for a location, ordered by sortOrder.
 * Children are nested under parent items (single level).
 */
async function getNavigationUncached(
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
export function getNavigation(
  location: 'HEADER' | 'FOOTER' | 'MOBILE',
  locale: string,
): Promise<NavItemPublic[]> {
  return withCache(cacheKeys.nav(location, locale), TTL_NAV, () => getNavigationUncached(location, locale))
}

// ─── Contact Channels ───

/**
 * Enabled contact channels ordered by sortOrder.
 */
async function getContactChannelsUncached(): Promise<ContactChannelPublic[]> {
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
export function getContactChannels(): Promise<ContactChannelPublic[]> {
  return withCache(cacheKeys.contacts(), TTL_CONTACTS, () => getContactChannelsUncached())
}

// ─── Site Settings ───

/**
 * Get a single site setting by key, returns parsed value or null.
 */
async function getSiteSettingUncached(key: string): Promise<unknown | null> {
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
export function getSiteSetting(key: string): Promise<unknown | null> {
  return withCache(cacheKeys.settings(key), TTL_SETTINGS, () => getSiteSettingUncached(key))
}