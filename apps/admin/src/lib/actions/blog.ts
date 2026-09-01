'use server'

import { cleanUpdate } from './clean-update'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { eq, and } from 'drizzle-orm'
import {
  blogCategories, blogCategoryTranslations,
  blogPosts, blogPostTranslations, redirectRules, seoMeta,
} from '@podvarchan/shared'
import { getCurrentUser } from '@/lib/auth/session'
import { requireDelete } from '@/lib/auth/guards'
import { canEditContent, canDelete } from '@/lib/auth/permissions'
import { getActionDb } from './db'
import type { ActionDb } from './db'
import { writeAuditLog } from '@/lib/audit/log'
import { revalidatePublic, revalidateAdmin, getBlogPostRevalidatePaths, getBlogPostCacheKeys, cacheKeys, cacheKeyPrefixes } from '@/lib/revalidate'
import { syncRedirectRulesToKv } from './redirects'
import { requirePublish, assertBilingual, assertMetaPresent } from './ymyl'
import { sanitizeHtml } from '@/lib/sanitize'

async function requireEdit(): Promise<string> {
  const user = await getCurrentUser()
  if (!user || !canEditContent(user.role)) throw new Error('Заборонено')
  return user.id
}

async function now(): Promise<string> { return new Date().toISOString() }

/** Category translation slugs for a category id (per locale) — for blog-cat cache keys. */
async function getCategorySlugs(
  db: ActionDb,
  categoryId: string | null | undefined,
): Promise<{ ru?: string; uk?: string }> {
  if (!categoryId) return {}
  const rows = await db
    .select()
    .from(blogCategoryTranslations)
    .where(eq(blogCategoryTranslations.categoryId, categoryId))
    .all()
  const out: { ru?: string; uk?: string } = {}
  for (const r of rows) out[r.locale as 'ru' | 'uk'] = r.slug
  return out
}

/* ── Category Schemas ── */

const catTranslationSchema = z.object({
  locale: z.enum(['ru', 'uk']),
  slug: z.string().min(1).max(200),
  name: z.string().max(200).optional().default(''),
  description: z.string().max(1000).optional().default(''),
})

const categorySchema = z.object({
  slugBase: z.string().min(1).max(200),
  serviceId: z.string().optional().default(''),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
  translations: z.array(catTranslationSchema).min(1).max(2),
})

/* ── Post Schemas ── */

const postTranslationSchema = z.object({
  locale: z.enum(['ru', 'uk']),
  slug: z.string().min(1).max(200),
  title: z.string().min(1).max(500),
  excerpt: z.string().optional().default(''),
  contentJson: z.string().optional().default(''),
  contentHtml: z.string().optional().default('').transform(sanitizeHtml),
  tableOfContentsJson: z.string().nullable().default(''),
  faqJson: z.string().optional().default(''),
})

const postSchema = z.object({
  categoryId: z.string().optional().default(''),
  authorId: z.string().nullable().default(''),
  coverImageId: z.string().optional().default(''),
  readingMinutes: z.coerce.number().int().min(0).optional().default(0),
  publishedAt: z.string().optional().default(''),
  scheduledAt: z.string().nullable().default(''),
  status: z.enum(['DRAFT', 'REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']).optional().default('DRAFT'),
  translations: z.array(postTranslationSchema).min(1).max(2),
})

/* ── Category Actions ── */

export async function createCategory(formData: FormData) {
  const userId = await requireEdit()
  const db = await getActionDb()
  const translations = [
    { locale: 'ru', slug: formData.get('ru_slug'), name: formData.get('ru_name'), description: formData.get('ru_description') },
    { locale: 'uk', slug: formData.get('uk_slug'), name: formData.get('uk_name'), description: formData.get('uk_description') },
  ].filter(t => t.slug)
  const parsed = categorySchema.safeParse({
    slugBase: formData.get('slugBase'), serviceId: formData.get('serviceId'),
    sortOrder: formData.get('sortOrder'), translations,
  })
  if (!parsed.success) throw new Error(`Помилка валідації: ${parsed.error.message}`)
  const data = parsed.data
  const id = crypto.randomUUID()
  await db.insert(blogCategories).values(cleanUpdate({
    id, slugBase: data.slugBase, serviceId: data.serviceId,
    sortOrder: data.sortOrder, status: 'PUBLISHED',
  }))
  for (const t of data.translations) {
    await db.insert(blogCategoryTranslations).values(cleanUpdate({
      id: crypto.randomUUID(), categoryId: id, locale: t.locale,
      slug: t.slug, name: t.name, description: t.description,
    }))
  }
  await writeAuditLog({ userId, action: 'CREATE', entityType: 'BLOG_CATEGORY', entityId: id, after: data })
  revalidateAdmin('/admin/blog/categories')
  const ruCatSlug = data.translations.find((t) => t.locale === 'ru')?.slug
  const ukCatSlug = data.translations.find((t) => t.locale === 'uk')?.slug
  await revalidatePublic({
    paths: [
      '/ru/blog/',
      '/uk/blog/',
      `/ru/blog/kategoriya/${ruCatSlug}/`,
      `/uk/blog/kategoriya/${ukCatSlug}/`,
      '/sitemap.xml',
    ],
    keys: [
      cacheKeys.blogCats('ru'),
      cacheKeys.blogCats('uk'),
      // llms-full.txt URL index embeds categorySlug per post.
      cacheKeys.blogListIndex('ru'),
      cacheKeys.blogListIndex('uk'),
      ...(ruCatSlug ? [cacheKeys.blogCatPosts(ruCatSlug, 'ru')] : []),
      ...(ukCatSlug ? [cacheKeys.blogCatPosts(ukCatSlug, 'uk')] : []),
    ],
    prefixes: [cacheKeyPrefixes.blogCatSlugPair],
  })
}


export async function updateCategory(id: string, formData: FormData) {
  const userId = await requireEdit()
  const db = await getActionDb()
  const existing = await db.select().from(blogCategories).where(eq(blogCategories.id, id)).get()
  if (!existing) throw new Error('Категорію не знайдено')
  const oldCatTrs = await db
    .select()
    .from(blogCategoryTranslations)
    .where(eq(blogCategoryTranslations.categoryId, id))
    .all()
  const translations = [
    { locale: 'ru', slug: formData.get('ru_slug'), name: formData.get('ru_name'), description: formData.get('ru_description') },
    { locale: 'uk', slug: formData.get('uk_slug'), name: formData.get('uk_name'), description: formData.get('uk_description') },
  ].filter(t => t.slug)
  const parsed = categorySchema.safeParse({
    slugBase: formData.get('slugBase'), serviceId: formData.get('serviceId'),
    sortOrder: formData.get('sortOrder'), translations,
  })
  if (!parsed.success) throw new Error(`Помилка валідації: ${parsed.error.message}`)
  const data = parsed.data
  await db.update(blogCategories).set(cleanUpdate({
    slugBase: data.slugBase, serviceId: data.serviceId,
    sortOrder: data.sortOrder,
  })).where(eq(blogCategories.id, id))
  for (const t of data.translations) {
    const existingTr = await db.select().from(blogCategoryTranslations)
      .where(and(eq(blogCategoryTranslations.categoryId, id), eq(blogCategoryTranslations.locale, t.locale))).get()
    if (existingTr) {
      await db.update(blogCategoryTranslations).set(cleanUpdate({
        slug: t.slug, name: t.name, description: t.description,
      })).where(and(eq(blogCategoryTranslations.categoryId, id), eq(blogCategoryTranslations.locale, t.locale)))
    } else {
      await db.insert(blogCategoryTranslations).values(cleanUpdate({
        id: crypto.randomUUID(), categoryId: id, locale: t.locale,
        slug: t.slug, name: t.name, description: t.description,
      }))
    }
  }
  await writeAuditLog({ userId, action: 'UPDATE', entityType: 'BLOG_CATEGORY', entityId: id, before: existing, after: data })
  revalidateAdmin('/admin/blog/categories')
  const ruCatSlug = data.translations.find((t) => t.locale === 'ru')?.slug
  const ukCatSlug = data.translations.find((t) => t.locale === 'uk')?.slug
  const oldRuCat = oldCatTrs.find((t) => t.locale === 'ru')?.slug
  const oldUkCat = oldCatTrs.find((t) => t.locale === 'uk')?.slug
  await revalidatePublic({
    paths: [
      '/ru/blog/',
      '/uk/blog/',
      `/ru/blog/kategoriya/${ruCatSlug}/`,
      `/uk/blog/kategoriya/${ukCatSlug}/`,
      '/sitemap.xml',
    ],
    keys: [
      cacheKeys.blogCats('ru'),
      cacheKeys.blogCats('uk'),
      // llms-full.txt URL index embeds categorySlug per post.
      cacheKeys.blogListIndex('ru'),
      cacheKeys.blogListIndex('uk'),
      ...(ruCatSlug ? [cacheKeys.blogCatPosts(ruCatSlug, 'ru')] : []),
      ...(ukCatSlug ? [cacheKeys.blogCatPosts(ukCatSlug, 'uk')] : []),
      ...(oldRuCat ? [cacheKeys.blogCatPosts(oldRuCat, 'ru')] : []),
      ...(oldUkCat ? [cacheKeys.blogCatPosts(oldUkCat, 'uk')] : []),
    ],
    prefixes: [cacheKeyPrefixes.blogCatSlugPair],
  })
}

export async function deleteCategory(id: string) {
  const { id: userId } = await requireDelete()
  const db = await getActionDb()
  const existing = await db.select().from(blogCategories).where(eq(blogCategories.id, id)).get()
  if (!existing) throw new Error('Категорію не знайдено')
  // seo_meta has no FK — delete linked rows atomically (P0-2).
  // D1 has no BEGIN/COMMIT — db.transaction() would fail; use db.batch().
  await db.batch([
    db.delete(seoMeta).where(and(eq(seoMeta.entityType, 'blog_category'), eq(seoMeta.entityId, id))),
    db.delete(blogCategories).where(eq(blogCategories.id, id)),
  ])
  await writeAuditLog({ userId, action: 'DELETE', entityType: 'BLOG_CATEGORY', entityId: id, before: existing })
  revalidateAdmin('/admin/blog/categories')
  // Revalidate blog area (list + category pages affected)
  await revalidatePublic({
    paths: ['/ru/blog/', '/uk/blog/', '/sitemap.xml'],
    type: 'layout',
    keys: [
      cacheKeys.blogCats('ru'),
      cacheKeys.blogCats('uk'),
      // llms-full.txt URL index embeds categorySlug per post.
      cacheKeys.blogListIndex('ru'),
      cacheKeys.blogListIndex('uk'),
    ],
    prefixes: [cacheKeyPrefixes.blogCatPosts, cacheKeyPrefixes.blogCatSlugPair],
  })
}

/* ── Post Actions ── */

export async function createPost(formData: FormData) {
  const userId = await requireEdit()
  const db = await getActionDb()
  const translations = [
    { locale: 'ru', slug: formData.get('ru_slug'), title: formData.get('ru_title'), excerpt: formData.get('ru_excerpt'), contentJson: formData.get('ru_contentJson'), contentHtml: formData.get('ru_contentHtml'), tableOfContentsJson: formData.get('ru_tableOfContentsJson'), faqJson: formData.get('ru_faqJson') },
    { locale: 'uk', slug: formData.get('uk_slug'), title: formData.get('uk_title'), excerpt: formData.get('uk_excerpt'), contentJson: formData.get('uk_contentJson'), contentHtml: formData.get('uk_contentHtml'), tableOfContentsJson: formData.get('uk_tableOfContentsJson'), faqJson: formData.get('uk_faqJson') },
  ].filter(t => t.slug)
  const parsed = postSchema.safeParse({
    categoryId: formData.get('categoryId'), authorId: formData.get('authorId'),
    coverImageId: formData.get('coverImageId'),
    readingMinutes: formData.get('readingMinutes'),
    publishedAt: formData.get('publishedAt'),
    scheduledAt: formData.get('scheduledAt'),
    status: formData.get('status'),
    translations,
  })
  if (!parsed.success) throw new Error(`Помилка валідації: ${parsed.error.message}`)
  const data = parsed.data
  if (data.status === 'PUBLISHED') {
    await requirePublish()
    const ruTr = data.translations.find((t) => t.locale === 'ru')
    const ukTr = data.translations.find((t) => t.locale === 'uk')
    assertBilingual(ruTr, ukTr, 'Post')
    await assertMetaPresent(ruTr!, db, 'Post')
  }
  const id = crypto.randomUUID()
  const ts = await now()
  await db.insert(blogPosts).values(cleanUpdate({
    id, categoryId: data.categoryId, authorId: data.authorId,
    status: data.status, coverImageId: data.coverImageId,
    readingMinutes: data.readingMinutes, publishedAt: data.publishedAt,
    scheduledAt: data.scheduledAt, createdAt: ts, updatedAt: ts,
  }))
  for (const t of data.translations) {
    await db.insert(blogPostTranslations).values(cleanUpdate({
      id: crypto.randomUUID(), postId: id, locale: t.locale, slug: t.slug,
      title: t.title, excerpt: t.excerpt,
      contentJson: t.contentJson, contentHtml: t.contentHtml,
      tableOfContentsJson: t.tableOfContentsJson, faqJson: t.faqJson,
    }))
  }
  await writeAuditLog({ userId, action: 'CREATE', entityType: 'BLOG_POST', entityId: id, after: data })
  const ruSlug = data.translations.find((t: { locale: string }) => t.locale === 'ru')?.slug || ''
  const ukSlug = data.translations.find((t: { locale: string }) => t.locale === 'uk')?.slug || ''
  const cats = await getCategorySlugs(db, data.categoryId)
  revalidateAdmin('/admin/blog/posts')
  await revalidatePublic({
    paths: getBlogPostRevalidatePaths(ruSlug, ukSlug, cats.ru, cats.uk),
    keys: getBlogPostCacheKeys(ruSlug, ukSlug, cats.ru, cats.uk, id),
    prefixes: [cacheKeyPrefixes.blogImages, cacheKeyPrefixes.blogSlugPair],
  })
}

export async function updatePost(id: string, formData: FormData) {
  const userId = await requireEdit()
  const db = await getActionDb()
  const existing = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).get()
  if (!existing) throw new Error('Публікацію не знайдено')
  const translations = [
    { locale: 'ru', slug: formData.get('ru_slug'), title: formData.get('ru_title'), excerpt: formData.get('ru_excerpt'), contentJson: formData.get('ru_contentJson'), contentHtml: formData.get('ru_contentHtml'), tableOfContentsJson: formData.get('ru_tableOfContentsJson'), faqJson: formData.get('ru_faqJson') },
    { locale: 'uk', slug: formData.get('uk_slug'), title: formData.get('uk_title'), excerpt: formData.get('uk_excerpt'), contentJson: formData.get('uk_contentJson'), contentHtml: formData.get('uk_contentHtml'), tableOfContentsJson: formData.get('uk_tableOfContentsJson'), faqJson: formData.get('uk_faqJson') },
  ].filter(t => t.slug)
  const parsed = postSchema.safeParse({
    categoryId: formData.get('categoryId'), authorId: formData.get('authorId'),
    coverImageId: formData.get('coverImageId'), readingMinutes: formData.get('readingMinutes'),
    publishedAt: formData.get('publishedAt'), scheduledAt: formData.get('scheduledAt'),
    status: formData.get('status'), translations,
  })
  if (!parsed.success) throw new Error(`Помилка валідації: ${parsed.error.message}`)
  const data = parsed.data
  if (data.status === 'PUBLISHED') {
    await requirePublish()
    const ruTr = data.translations.find((t) => t.locale === 'ru')
    const ukTr = data.translations.find((t) => t.locale === 'uk')
    assertBilingual(ruTr, ukTr, 'Post')
    const existingRu = await db
      .select({ seoMetaId: blogPostTranslations.seoMetaId })
      .from(blogPostTranslations)
      .where(and(eq(blogPostTranslations.postId, id), eq(blogPostTranslations.locale, 'ru')))
      .get()
    await assertMetaPresent({ ...ruTr, seoMetaId: existingRu?.seoMetaId ?? null }, db, 'Post')
  }

  // If post was PUBLISHED and slug changed → insert 301 redirect
  if (existing.status === 'PUBLISHED') {
    const oldTranslations = await db
      .select()
      .from(blogPostTranslations)
      .where(eq(blogPostTranslations.postId, id))
      .all()
    const redirectTs = await now()
    for (const newT of data.translations) {
      const oldT = oldTranslations.find(t => t.locale === newT.locale)
      if (oldT && oldT.slug !== newT.slug) {
        const oldPath = `/${newT.locale}/blog/${oldT.slug}/`
        const newPath = `/${newT.locale}/blog/${newT.slug}/`
        const existingRule = await db
          .select()
          .from(redirectRules)
          .where(and(eq(redirectRules.fromPath, oldPath), eq(redirectRules.toPath, newPath)))
          .get()
        if (!existingRule) {
          await db.insert(redirectRules).values({
            id: crypto.randomUUID(),
            fromPath: oldPath,
            toPath: newPath,
            statusCode: 301,
            isEnabled: true,
            hitCount: 0,
            createdAt: redirectTs,
          })
        }
      }
    }
  }
  await syncRedirectRulesToKv()


  const ts = await now()
  await db.update(blogPosts).set(cleanUpdate({
    categoryId: data.categoryId, authorId: data.authorId,
    status: data.status, coverImageId: data.coverImageId,
    readingMinutes: data.readingMinutes, publishedAt: data.publishedAt,
    scheduledAt: data.scheduledAt, updatedAt: ts,
  })).where(eq(blogPosts.id, id))
  for (const t of data.translations) {
    const existingTr = await db.select().from(blogPostTranslations)
      .where(and(eq(blogPostTranslations.postId, id), eq(blogPostTranslations.locale, t.locale))).get()
    if (existingTr) {
      await db.update(blogPostTranslations).set(cleanUpdate({
        slug: t.slug, title: t.title, excerpt: t.excerpt,
        contentJson: t.contentJson, contentHtml: t.contentHtml,
        tableOfContentsJson: t.tableOfContentsJson, faqJson: t.faqJson,
      })).where(and(eq(blogPostTranslations.postId, id), eq(blogPostTranslations.locale, t.locale)))
    } else {
      await db.insert(blogPostTranslations).values(cleanUpdate({
        id: crypto.randomUUID(), postId: id, locale: t.locale, slug: t.slug,
        title: t.title, excerpt: t.excerpt,
        contentJson: t.contentJson, contentHtml: t.contentHtml,
        tableOfContentsJson: t.tableOfContentsJson, faqJson: t.faqJson,
      }))
    }
  }
  await writeAuditLog({ userId, action: 'UPDATE', entityType: 'BLOG_POST', entityId: id, before: existing, after: data })
  const ruSlug = data.translations.find((t: { locale: string }) => t.locale === 'ru')?.slug || ''
  const ukSlug = data.translations.find((t: { locale: string }) => t.locale === 'uk')?.slug || ''
  revalidateAdmin('/admin/blog/posts', `/admin/blog/posts/${id}`)
  const oldTrs = await db
    .select()
    .from(blogPostTranslations)
    .where(eq(blogPostTranslations.postId, id))
    .all()
  const oldRuSlug = oldTrs.find((t) => t.locale === 'ru')?.slug || ''
  const oldUkSlug = oldTrs.find((t) => t.locale === 'uk')?.slug || ''
  const newCats = await getCategorySlugs(db, data.categoryId)
  const oldCats = await getCategorySlugs(db, existing.categoryId)
  await revalidatePublic({
    paths: getBlogPostRevalidatePaths(ruSlug, ukSlug, newCats.ru, newCats.uk),
    keys: [
      ...getBlogPostCacheKeys(ruSlug, ukSlug, newCats.ru, newCats.uk, id),
      ...(oldRuSlug ? [cacheKeys.blogPost(oldRuSlug, 'ru')] : []),
      ...(oldUkSlug ? [cacheKeys.blogPost(oldUkSlug, 'uk')] : []),
      ...(oldCats.ru ? [cacheKeys.blogCatPosts(oldCats.ru, 'ru')] : []),
      ...(oldCats.uk ? [cacheKeys.blogCatPosts(oldCats.uk, 'uk')] : []),
    ],
    prefixes: [cacheKeyPrefixes.blogImages, cacheKeyPrefixes.blogSlugPair],
  })
}

export async function deletePost(id: string) {
  const { id: userId } = await requireDelete()
  const db = await getActionDb()
  const existing = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).get()
  if (!existing) throw new Error('Публікацію не знайдено')

  // Capture slugs before the cascade delete removes translations.
  const trs = await db
    .select()
    .from(blogPostTranslations)
    .where(eq(blogPostTranslations.postId, id))
    .all()
  const ruSlug = trs.find((t) => t.locale === 'ru')?.slug || ''
  const ukSlug = trs.find((t) => t.locale === 'uk')?.slug || ''
  const cats = await getCategorySlugs(db, existing.categoryId)

  // seo_meta has no FK — delete linked rows atomically (P0-2).
  // D1 has no BEGIN/COMMIT — db.transaction() would fail; use db.batch().
  await db.batch([
    db.delete(seoMeta).where(and(eq(seoMeta.entityType, 'blog_post'), eq(seoMeta.entityId, id))),
    db.delete(blogPosts).where(eq(blogPosts.id, id)),
  ])

  await writeAuditLog({ userId, action: 'DELETE', entityType: 'BLOG_POST', entityId: id, before: existing })
  revalidateAdmin('/admin/blog/posts')
  await revalidatePublic({
    paths: ['/ru/blog/', '/uk/blog/', '/sitemap.xml'],
    type: 'layout',
    keys: getBlogPostCacheKeys(ruSlug, ukSlug, cats.ru, cats.uk, id),
    prefixes: [cacheKeyPrefixes.blogImages, cacheKeyPrefixes.blogSlugPair],
  })
}

export async function publishPost(id: string) {
  const userId = await requireEdit()
  const db = await getActionDb()
  const existing = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).get()
  if (!existing) throw new Error('Публікацію не знайдено')

  const newStatus = existing.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'

  // YMYL: only OWNER/ADMIN can publish
  if (newStatus === 'PUBLISHED') {
    await requirePublish()

    // Load ru + uk translations
    const translations = await db
      .select()
      .from(blogPostTranslations)
      .where(eq(blogPostTranslations.postId, id))
      .all()

    const ruTr = translations.find(t => t.locale === 'ru')
    const ukTr = translations.find(t => t.locale === 'uk')

    assertBilingual(ruTr, ukTr, 'Публікація')
    await assertMetaPresent(ruTr!, db, 'Публікація')
  }

  await db.update(blogPosts).set({ status: newStatus, updatedAt: await now() }).where(eq(blogPosts.id, id))
  await writeAuditLog({
    userId, action: newStatus === 'PUBLISHED' ? 'PUBLISH' : 'UNPUBLISH',
    entityType: 'BLOG_POST', entityId: id, after: { status: newStatus },
  })
  revalidateAdmin('/admin/blog/posts')
  const trs = await db
    .select()
    .from(blogPostTranslations)
    .where(eq(blogPostTranslations.postId, id))
    .all()
  const ruSlug = trs.find((t) => t.locale === 'ru')?.slug || ''
  const ukSlug = trs.find((t) => t.locale === 'uk')?.slug || ''
  const cats = await getCategorySlugs(db, existing.categoryId)
  await revalidatePublic({
    paths: ['/ru/blog/', '/uk/blog/', '/sitemap.xml'],
    type: 'layout',
    keys: getBlogPostCacheKeys(ruSlug, ukSlug, cats.ru, cats.uk, id),
    prefixes: [cacheKeyPrefixes.blogImages, cacheKeyPrefixes.blogSlugPair],
  })
}
