'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getDB } from '@/db'
import {
  blogCategories,
  blogCategoryTranslations,
  blogPosts,
  blogPostTranslations,
} from '@/db/schema/blog'
import { auditLogs } from '@/db/schema/auth'
import { getCurrentUser } from '@/lib/auth/session'
import { canEditContent, canDelete } from '@/lib/auth/permissions'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'

/* ── Helpers ── */

async function requireEdit() {
  const user = await getCurrentUser()
  if (!user || !canEditContent(user.role)) throw new Error('Forbidden')
  return user
}

function now() { return new Date().toISOString() }

/* ── Category Schemas ── */

const catTranslationSchema = z.object({
  locale: z.enum(['ru', 'uk']),
  slug: z.string().min(1).max(200),
  name: z.string().min(1).max(300),
  description: z.string().max(2000).optional().default(''),
})

const categorySchema = z.object({
  slugBase: z.string().min(1).max(200),
  serviceId: z.string().optional().default(''),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional().default('DRAFT'),
  translations: z.array(catTranslationSchema).min(1).max(2),
})

/* ── Category Actions ── */

export async function createCategory(formData: FormData) {
  const user = await requireEdit()
  const db = getDB()

  const raw = extractCommon(formData)
  const translations = extractTranslations(formData, ['slug', 'name', 'description'])
  raw.translations = translations

  const parsed = categorySchema.safeParse(raw)
  if (!parsed.success) throw new Error(`Validation error: ${parsed.error.message}`)

  const data = parsed.data
  const id = randomUUID()

  const existing = await db.select().from(blogCategories).where(eq(blogCategories.slugBase, data.slugBase)).get()
  if (existing) throw new Error(`Category "${data.slugBase}" already exists`)

  await db.insert(blogCategories).values({
    id,
    slugBase: data.slugBase,
    serviceId: data.serviceId || null,
    sortOrder: data.sortOrder,
    status: data.status,
  })

  for (const t of data.translations) {
    await db.insert(blogCategoryTranslations).values({
      id: randomUUID(), categoryId: id,
      locale: t.locale, slug: t.slug,
      name: t.name, description: t.description || null,
    })
  }

  await db.insert(auditLogs).values({
    id: randomUUID(), userId: user.id, action: 'CREATE', entityType: 'blog_category', entityId: id,
    afterJson: JSON.stringify(data), createdAt: now(),
  })

  revalidatePath('/admin/blog/categories')
  redirect('/admin/blog/categories')
}

export async function updateCategory(id: string, formData: FormData) {
  const user = await requireEdit()
  const db = getDB()

  const existing = await db.select().from(blogCategories).where(eq(blogCategories.id, id)).get()
  if (!existing) throw new Error('Category not found')

  const raw = extractCommon(formData)
  const translations = extractTranslations(formData, ['slug', 'name', 'description'])
  raw.translations = translations

  const parsed = categorySchema.safeParse(raw)
  if (!parsed.success) throw new Error(`Validation error: ${parsed.error.message}`)

  const data = parsed.data

  await db.update(blogCategories).set({
    slugBase: data.slugBase,
    serviceId: data.serviceId || null,
    sortOrder: data.sortOrder,
    status: data.status,
  }).where(eq(blogCategories.id, id))

  for (const t of data.translations) {
    const existingTr = await db.select().from(blogCategoryTranslations)
      .where(and(eq(blogCategoryTranslations.categoryId, id), eq(blogCategoryTranslations.locale, t.locale))).get()
    if (existingTr) {
      await db.update(blogCategoryTranslations).set({
        slug: t.slug, name: t.name, description: t.description || null,
      }).where(and(eq(blogCategoryTranslations.categoryId, id), eq(blogCategoryTranslations.locale, t.locale)))
    } else {
      await db.insert(blogCategoryTranslations).values({
        id: randomUUID(), categoryId: id,
        locale: t.locale, slug: t.slug, name: t.name, description: t.description || null,
      })
    }
  }

  await db.insert(auditLogs).values({
    id: randomUUID(), userId: user.id, action: 'UPDATE', entityType: 'blog_category', entityId: id,
    beforeJson: JSON.stringify(existing), afterJson: JSON.stringify(data), createdAt: now(),
  })

  revalidatePath('/admin/blog/categories')
  redirect('/admin/blog/categories')
}

export async function deleteCategory(id: string) {
  const user = await getCurrentUser()
  if (!user || !canDelete(user.role)) throw new Error('Forbidden')
  const db = getDB()
  await db.delete(blogCategories).where(eq(blogCategories.id, id))
  await db.insert(auditLogs).values({
    id: randomUUID(), userId: user.id, action: 'DELETE', entityType: 'blog_category', entityId: id,
    createdAt: now(),
  })
  revalidatePath('/admin/blog/categories')
}

/* ── Post Schemas ── */

const postTranslationSchema = z.object({
  locale: z.enum(['ru', 'uk']),
  slug: z.string().min(1).max(200),
  title: z.string().min(1).max(500),
  excerpt: z.string().max(2000).optional().default(''),
  contentJson: z.string().optional().default(''),
  contentHtml: z.string().optional().default(''),
  faqJson: z.string().optional().default(''),
})

const postSchema = z.object({
  categoryId: z.string().optional().default(''),
  status: z.enum(['DRAFT', 'REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']).optional().default('DRAFT'),
  readingMinutes: z.coerce.number().int().min(0).optional().default(0),
  publishedAt: z.string().optional().default(''),
  scheduledAt: z.string().optional().default(''),
  translations: z.array(postTranslationSchema).min(1).max(2),
})

/* ── Post Actions ── */

export async function createPost(formData: FormData) {
  const user = await requireEdit()
  const db = getDB()

  const raw = extractPostCommon(formData)
  const translations = extractPostTranslations(formData)
  raw.translations = translations

  const parsed = postSchema.safeParse(raw)
  if (!parsed.success) throw new Error(`Validation error: ${parsed.error.message}`)

  const data = parsed.data
  const id = randomUUID()

  await db.insert(blogPosts).values({
    id,
    categoryId: data.categoryId || null,
    authorId: user.id,
    status: data.status,
    readingMinutes: data.readingMinutes || null,
    publishedAt: data.publishedAt || null,
    scheduledAt: data.scheduledAt || null,
    createdAt: now(),
    updatedAt: now(),
  })

  for (const t of data.translations) {
    await db.insert(blogPostTranslations).values({
      id: randomUUID(), postId: id,
      locale: t.locale, slug: t.slug, title: t.title,
      excerpt: t.excerpt || null, contentJson: t.contentJson || null,
      contentHtml: t.contentHtml || null, faqJson: t.faqJson || null,
    })
  }

  await db.insert(auditLogs).values({
    id: randomUUID(), userId: user.id, action: 'CREATE', entityType: 'blog_post', entityId: id,
    afterJson: JSON.stringify(data), createdAt: now(),
  })

  revalidatePath('/admin/blog/posts')
  redirect('/admin/blog/posts')
}

export async function updatePost(id: string, formData: FormData) {
  const user = await requireEdit()
  const db = getDB()

  const existing = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).get()
  if (!existing) throw new Error('Post not found')

  const raw = extractPostCommon(formData)
  const translations = extractPostTranslations(formData)
  raw.translations = translations

  const parsed = postSchema.safeParse(raw)
  if (!parsed.success) throw new Error(`Validation error: ${parsed.error.message}`)

  const data = parsed.data

  await db.update(blogPosts).set({
    categoryId: data.categoryId || null,
    status: data.status,
    readingMinutes: data.readingMinutes || null,
    publishedAt: data.publishedAt || null,
    scheduledAt: data.scheduledAt || null,
    updatedAt: now(),
  }).where(eq(blogPosts.id, id))

  for (const t of data.translations) {
    const existingTr = await db.select().from(blogPostTranslations)
      .where(and(eq(blogPostTranslations.postId, id), eq(blogPostTranslations.locale, t.locale))).get()
    if (existingTr) {
      await db.update(blogPostTranslations).set({
        slug: t.slug, title: t.title, excerpt: t.excerpt || null,
        contentJson: t.contentJson || null, contentHtml: t.contentHtml || null,
        faqJson: t.faqJson || null,
      }).where(and(eq(blogPostTranslations.postId, id), eq(blogPostTranslations.locale, t.locale)))
    } else {
      await db.insert(blogPostTranslations).values({
        id: randomUUID(), postId: id,
        locale: t.locale, slug: t.slug, title: t.title,
        excerpt: t.excerpt || null, contentJson: t.contentJson || null,
        contentHtml: t.contentHtml || null, faqJson: t.faqJson || null,
      })
    }
  }

  await db.insert(auditLogs).values({
    id: randomUUID(), userId: user.id, action: 'UPDATE', entityType: 'blog_post', entityId: id,
    beforeJson: JSON.stringify(existing), afterJson: JSON.stringify(data), createdAt: now(),
  })

  revalidatePath('/admin/blog/posts')
  redirect('/admin/blog/posts')
}

export async function deletePost(id: string) {
  const user = await getCurrentUser()
  if (!user || !canDelete(user.role)) throw new Error('Forbidden')
  const db = getDB()
  await db.delete(blogPosts).where(eq(blogPosts.id, id))
  await db.insert(auditLogs).values({
    id: randomUUID(), userId: user.id, action: 'DELETE', entityType: 'blog_post', entityId: id,
    createdAt: now(),
  })
  revalidatePath('/admin/blog/posts')
}

export async function publishPost(id: string) {
  const user = await requireEdit()
  const db = getDB()
  const post = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).get()
  if (!post) throw new Error('Post not found')
  const newStatus = post.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
  await db.update(blogPosts).set({ status: newStatus, updatedAt: now(), publishedAt: newStatus === 'PUBLISHED' ? now() : null }).where(eq(blogPosts.id, id))
  await db.insert(auditLogs).values({
    id: randomUUID(), userId: user.id, action: newStatus === 'PUBLISHED' ? 'PUBLISH' : 'UNPUBLISH',
    entityType: 'blog_post', entityId: id, afterJson: JSON.stringify({ status: newStatus }), createdAt: now(),
  })
  revalidatePath('/admin/blog/posts')
}

/* ── FormData helpers ── */

function extractCommon(formData: FormData): Record<string, unknown> {
  return {
    slugBase: formData.get('slugBase'),
    serviceId: formData.get('serviceId'),
    sortOrder: formData.get('sortOrder'),
    status: formData.get('status'),
  }
}

function extractTranslations(formData: FormData, fields: string[]): unknown[] {
  const locales = ['ru', 'uk']
  const result: unknown[] = []
  for (const locale of locales) {
    const slug = formData.get(`${locale}_slug`)
    if (!slug) continue
    const obj: Record<string, unknown> = { locale, slug }
    for (const field of fields) {
      obj[field] = formData.get(`${locale}_${field}`) ?? ''
    }
    result.push(obj)
  }
  return result
}

function extractPostCommon(formData: FormData): Record<string, unknown> {
  return {
    categoryId: formData.get('categoryId'),
    status: formData.get('status'),
    readingMinutes: formData.get('readingMinutes'),
    publishedAt: formData.get('publishedAt'),
    scheduledAt: formData.get('scheduledAt'),
  }
}

function extractPostTranslations(formData: FormData): unknown[] {
  const locales = ['ru', 'uk']
  const result: unknown[] = []
  for (const locale of locales) {
    const slug = formData.get(`${locale}_slug`)
    if (!slug) continue
    result.push({
      locale, slug,
      title: formData.get(`${locale}_title`) ?? '',
      excerpt: formData.get(`${locale}_excerpt`) ?? '',
      contentJson: formData.get(`${locale}_contentJson`) ?? '',
      contentHtml: formData.get(`${locale}_contentHtml`) ?? '',
      faqJson: formData.get(`${locale}_faqJson`) ?? '',
    })
  }
  return result
}
