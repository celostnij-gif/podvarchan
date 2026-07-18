'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq, and } from 'drizzle-orm'
import {
  blogCategories, blogCategoryTranslations,
  blogPosts, blogPostTranslations, redirectRules, seoMeta,
} from '@podvarchan/shared'
import { getCurrentUser } from '@/lib/auth/session'
import { canEditContent, canDelete, canPublish } from '@/lib/auth/permissions'
import { getActionDb } from './db'
import { writeAuditLog } from '@/lib/audit/log'
import { revalidatePublic, revalidateAdmin, getBlogPostRevalidatePaths } from '@/lib/revalidate'
import { syncRedirectRulesToKv } from './redirects'
import { requirePublish, assertBilingual, assertMetaPresent } from './ymyl'

async function requireEdit(): Promise<string> {
  const user = await getCurrentUser()
  if (!user || !canEditContent(user.role)) throw new Error('Forbidden')
  return user.id
}

async function now(): Promise<string> { return new Date().toISOString() }

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
  contentHtml: z.string().optional().default(''),
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
  if (!parsed.success) throw new Error(`Validation error: ${parsed.error.message}`)
  const data = parsed.data
  const id = crypto.randomUUID()
  const ts = await now()
  await db.insert(blogCategories).values({ id, slugBase: data.slugBase, serviceId: data.serviceId || null, sortOrder: data.sortOrder, status: 'PUBLISHED' })
  for (const t of data.translations) {
    await db.insert(blogCategoryTranslations).values({ id: crypto.randomUUID(), categoryId: id, locale: t.locale, slug: t.slug, name: t.name || null, description: t.description || null })
  }
  await writeAuditLog({ userId, action: 'CREATE', entityType: 'BLOG_CATEGORY', entityId: id, after: data })
  revalidateAdmin('/admin/blog/categories')
  revalidatePublic({ paths: [
    '/ru/blog/',
    '/uk/blog/',
    '/ru/blog/kategoriya/' + translations.find(t => t.locale === 'ru')?.slug + '/',
    '/uk/blog/kategoriya/' + translations.find(t => t.locale === 'uk')?.slug + '/',
    '/sitemap.xml',
  ] })
  redirect('/admin/blog/categories')
}


export async function updateCategory(id: string, formData: FormData) {
  const userId = await requireEdit()
  const db = await getActionDb()
  const existing = await db.select().from(blogCategories).where(eq(blogCategories.id, id)).get()
  if (!existing) throw new Error('Category not found')
  const translations = [
    { locale: 'ru', slug: formData.get('ru_slug'), name: formData.get('ru_name'), description: formData.get('ru_description') },
    { locale: 'uk', slug: formData.get('uk_slug'), name: formData.get('uk_name'), description: formData.get('uk_description') },
  ].filter(t => t.slug)
  const parsed = categorySchema.safeParse({
    slugBase: formData.get('slugBase'), serviceId: formData.get('serviceId'),
    sortOrder: formData.get('sortOrder'), translations,
  })
  if (!parsed.success) throw new Error(`Validation error: ${parsed.error.message}`)
  const data = parsed.data
  await db.update(blogCategories).set({ slugBase: data.slugBase, serviceId: data.serviceId || null, sortOrder: data.sortOrder }).where(eq(blogCategories.id, id))
  for (const t of data.translations) {
    const existingTr = await db.select().from(blogCategoryTranslations).where(and(eq(blogCategoryTranslations.categoryId, id), eq(blogCategoryTranslations.locale, t.locale))).get()
    if (existingTr) {
      await db.update(blogCategoryTranslations).set({ slug: t.slug, name: t.name || null, description: t.description || null }).where(and(eq(blogCategoryTranslations.categoryId, id), eq(blogCategoryTranslations.locale, t.locale)))
    } else {
      await db.insert(blogCategoryTranslations).values({ id: crypto.randomUUID(), categoryId: id, locale: t.locale, slug: t.slug, name: t.name || null, description: t.description || null })
    }
  }
  await writeAuditLog({ userId, action: 'UPDATE', entityType: 'BLOG_CATEGORY', entityId: id, before: existing, after: data })
  revalidateAdmin('/admin/blog/categories')
  void revalidatePublic({ paths: [
    '/ru/blog/',
    '/uk/blog/',
    '/ru/blog/kategoriya/' + data.translations.find(t => t.locale === 'ru')?.slug + '/',
    '/uk/blog/kategoriya/' + data.translations.find(t => t.locale === 'uk')?.slug + '/',
    '/sitemap.xml',
  ] })
  redirect('/admin/blog/categories')
}

export async function deleteCategory(id: string) {
  const userId = await requireEdit()
  const db = await getActionDb()
  const existing = await db.select().from(blogCategories).where(eq(blogCategories.id, id)).get()
  if (!existing) throw new Error('Category not found')
  await db.delete(blogCategories).where(eq(blogCategories.id, id))
  await writeAuditLog({ userId, action: 'DELETE', entityType: 'BLOG_CATEGORY', entityId: id, before: existing })
  revalidateAdmin('/admin/blog/categories')
  // Revalidate blog area (list + category pages affected)
  void revalidatePublic({ paths: ['/ru/blog/', '/uk/blog/', '/sitemap.xml'], type: 'layout' })
  redirect('/admin/blog/categories')
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
    coverImageId: formData.get('coverImageId'), readingMinutes: formData.get('readingMinutes'),
    publishedAt: formData.get('publishedAt'), scheduledAt: formData.get('scheduledAt'),
    status: formData.get('status'), translations,
  })
  if (!parsed.success) throw new Error(`Validation error: ${parsed.error.message}`)
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
  await db.insert(blogPosts).values({
    id, categoryId: data.categoryId || null, authorId: data.authorId || null,
    status: data.status, coverImageId: data.coverImageId || null,
    readingMinutes: data.readingMinutes, publishedAt: data.publishedAt || null,
    scheduledAt: data.scheduledAt || null, createdAt: ts, updatedAt: ts,
  })
  for (const t of data.translations) {
    await db.insert(blogPostTranslations).values({
      id: crypto.randomUUID(), postId: id, locale: t.locale, slug: t.slug,
      title: t.title || null, excerpt: t.excerpt || null,
      contentJson: t.contentJson || null, contentHtml: t.contentHtml || null,
      tableOfContentsJson: t.tableOfContentsJson || null, faqJson: t.faqJson || null,
    })
  }
  await writeAuditLog({ userId, action: 'CREATE', entityType: 'BLOG_POST', entityId: id, after: data })
  const ruSlug = data.translations.find((t: { locale: string }) => t.locale === 'ru')?.slug || ''
  const ukSlug = data.translations.find((t: { locale: string }) => t.locale === 'uk')?.slug || ''
  revalidateAdmin('/admin/blog/posts')
  void revalidatePublic({ paths: getBlogPostRevalidatePaths(ruSlug, ukSlug) })
  redirect('/admin/blog/posts')
}

export async function updatePost(id: string, formData: FormData) {
  const userId = await requireEdit()
  const db = await getActionDb()
  const existing = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).get()
  if (!existing) throw new Error('Post not found')
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
  if (!parsed.success) throw new Error(`Validation error: ${parsed.error.message}`)
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
  await db.update(blogPosts).set({
    categoryId: data.categoryId || null, authorId: data.authorId || null,
    status: data.status, coverImageId: data.coverImageId || null,
    readingMinutes: data.readingMinutes, publishedAt: data.publishedAt || null,
    scheduledAt: data.scheduledAt || null, updatedAt: ts,
  }).where(eq(blogPosts.id, id))
  for (const t of data.translations) {
    const existingTr = await db.select().from(blogPostTranslations).where(and(eq(blogPostTranslations.postId, id), eq(blogPostTranslations.locale, t.locale))).get()
    if (existingTr) {
      await db.update(blogPostTranslations).set({
        slug: t.slug, title: t.title || null, excerpt: t.excerpt || null,
        contentJson: t.contentJson || null, contentHtml: t.contentHtml || null,
        tableOfContentsJson: t.tableOfContentsJson || null, faqJson: t.faqJson || null,
      }).where(and(eq(blogPostTranslations.postId, id), eq(blogPostTranslations.locale, t.locale)))
    } else {
      await db.insert(blogPostTranslations).values({
        id: crypto.randomUUID(), postId: id, locale: t.locale, slug: t.slug,
        title: t.title || null, excerpt: t.excerpt || null,
        contentJson: t.contentJson || null, contentHtml: t.contentHtml || null,
        tableOfContentsJson: t.tableOfContentsJson || null, faqJson: t.faqJson || null,
      })
    }
  }
  await writeAuditLog({ userId, action: 'UPDATE', entityType: 'BLOG_POST', entityId: id, before: existing, after: data })
  const ruSlug = data.translations.find((t: { locale: string }) => t.locale === 'ru')?.slug || ''
  const ukSlug = data.translations.find((t: { locale: string }) => t.locale === 'uk')?.slug || ''
  revalidateAdmin('/admin/blog/posts', `/admin/blog/posts/${id}`)
  void revalidatePublic({ paths: getBlogPostRevalidatePaths(ruSlug, ukSlug) })
  redirect('/admin/blog/posts')
}

export async function deletePost(id: string) {
  const userId = await requireEdit()
  const db = await getActionDb()
  const existing = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).get()
  if (!existing) throw new Error('Post not found')
  await db.delete(blogPosts).where(eq(blogPosts.id, id))
  await writeAuditLog({ userId, action: 'DELETE', entityType: 'BLOG_POST', entityId: id, before: existing })
  revalidateAdmin('/admin/blog/posts')
  void revalidatePublic({ paths: ['/ru/blog/', '/uk/blog/', '/sitemap.xml'], type: 'layout' })
  redirect('/admin/blog/posts')
}

export async function publishPost(id: string) {
  const userId = await requireEdit()
  const db = await getActionDb()
  const existing = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).get()
  if (!existing) throw new Error('Post not found')

  const newStatus = existing.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'

  // YMYL: only OWNER/ADMIN can publish
  if (newStatus === 'PUBLISHED') {
    const user = await getCurrentUser()
    if (!user || !canPublish(user.role)) throw new Error('Only OWNER or ADMIN can publish')

    // Load ru + uk translations
    const translations = await db
      .select()
      .from(blogPostTranslations)
      .where(eq(blogPostTranslations.postId, id))
      .all()

    const ruTr = translations.find(t => t.locale === 'ru')
    const ukTr = translations.find(t => t.locale === 'uk')

    // Require non-empty: ru.title, ru.slug, uk.title, uk.slug
    if (!ruTr?.title || !ruTr?.slug) throw new Error('RU translation must have non-empty title and slug')
    if (!ukTr?.title || !ukTr?.slug) throw new Error('UK translation must have non-empty title and slug')

    // Require meta description (seo_meta.description OR excerpt >= 50 chars)
    const meta = ruTr.seoMetaId
      ? await db.select().from(seoMeta).where(eq(seoMeta.id, ruTr.seoMetaId)).get()
      : null
    const hasMetaDesc = meta?.description && meta.description.length > 0
    const hasExcerpt = ruTr.excerpt && ruTr.excerpt.length >= 50
    if (!hasMetaDesc && !hasExcerpt) throw new Error('Post must have a meta description (seo_meta.description or excerpt >= 50 chars)')
  }

  await db.update(blogPosts).set({ status: newStatus, updatedAt: await now() }).where(eq(blogPosts.id, id))
  await writeAuditLog({
    userId, action: newStatus === 'PUBLISHED' ? 'PUBLISH' : 'UNPUBLISH',
    entityType: 'BLOG_POST', entityId: id, after: { status: newStatus },
  })
  revalidateAdmin('/admin/blog/posts')
  void revalidatePublic({ paths: ['/ru/blog/', '/uk/blog/', '/sitemap.xml'], type: 'layout' })
}
