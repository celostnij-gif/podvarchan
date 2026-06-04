'use server'

/**
 * Server Actions для модуля «Блог».
 */

import { eq, and, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getActionDb } from './db'
import { ok, okVoid, fail } from './result'
import { withRole, withCanDelete } from './guard'
import * as s from '@/db/schema'
import { writeAuditLog } from '@/lib/audit/log'

/* ── Schemas ── */

const BlogPostSchema = z.object({
  categoryId: z.string().optional(),
  readingMinutes: z.number().int().min(1).max(120).default(5),
  translations: z.array(z.object({
    locale: z.enum(['ru', 'uk']),
    slug: z.string().min(1),
    title: z.string().min(1, 'Назва обов\'язкова'),
    excerpt: z.string().optional(),
    contentJson: z.string().optional(),
    contentHtml: z.string().optional(),
  })).min(1),
})

/* ── Read ── */

export async function getBlogPosts() {
  try {
    const db = getActionDb()
    const items = await db.select().from(s.blogPosts).orderBy(desc(s.blogPosts.createdAt))
    return ok(items)
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося завантажити статті')
  }
}

export async function getBlogPost(id: string) {
  try {
    const db = getActionDb()
    const [post] = await db.select().from(s.blogPosts).where(eq(s.blogPosts.id, id)).limit(1)
    if (!post) return fail('Статтю не знайдено')

    const translations = await db.select()
      .from(s.blogPostTranslations)
      .where(eq(s.blogPostTranslations.postId, id))
    const categories = await db.select().from(s.blogCategories)

    return ok({ ...post, translations, categories })
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося завантажити статтю')
  }
}

/* ── Create ── */

export const createBlogPost = withRole('EDITOR', async (session, ...args) => {
  try {
    const db = getActionDb()
    const id = crypto.randomUUID()
    const input = BlogPostSchema.parse(args[0] ?? {})

    await db.insert(s.blogPosts).values({
      id,
      categoryId: input.categoryId ?? null,
      authorId: session.user.id,
      status: 'DRAFT',
      readingMinutes: input.readingMinutes,
    })

    for (const t of input.translations) {
      await db.insert(s.blogPostTranslations).values({
        id: crypto.randomUUID(),
        postId: id,
        locale: t.locale,
        slug: t.slug,
        title: t.title,
        excerpt: t.excerpt ?? null,
        contentJson: t.contentJson ?? null,
        contentHtml: t.contentHtml ?? null,
      })
    }

    await writeAuditLog({ userId: session.user.id, action: 'CREATE', entityType: 'BLOG_POST', entityId: id })
    revalidatePath('/admin/blog')

    const [created] = await db.select().from(s.blogPosts).where(eq(s.blogPosts.id, id)).limit(1)
    return ok(created, 'Статтю створено')
  } catch (e) {
    if (e instanceof z.ZodError) {
      const fieldErrors: Record<string, string[]> = {}
      for (const issue of e.issues) {
        const path = issue.path.join('.')
        if (!fieldErrors[path]) fieldErrors[path] = []
        fieldErrors[path].push(issue.message)
      }
      return fail('Помилка валідації', fieldErrors)
    }
    return fail(e instanceof Error ? e.message : 'Не вдалося створити статтю')
  }
})

/* ── Update ── */

export const updateBlogPost = withRole('EDITOR', async (session, ...args) => {
  try {
    const db = getActionDb()
    const id = args[0] as string
    const [existing] = await db.select().from(s.blogPosts).where(eq(s.blogPosts.id, id)).limit(1)
    if (!existing) return fail('Статтю не знайдено')

    const input = BlogPostSchema.partial().parse(args[1] ?? {})

    const updateData: Record<string, unknown> = {}
    if (input.categoryId !== undefined) updateData.categoryId = input.categoryId
    if (input.readingMinutes !== undefined) updateData.readingMinutes = input.readingMinutes
    if (Object.keys(updateData).length > 0) {
      await db.update(s.blogPosts).set(updateData).where(eq(s.blogPosts.id, id))
    }

    if (input.translations) {
      for (const t of input.translations) {
        const [existingT] = await db.select()
          .from(s.blogPostTranslations)
          .where(and(eq(s.blogPostTranslations.postId, id), eq(s.blogPostTranslations.locale, t.locale)))
          .limit(1)

        if (existingT) {
          await db.update(s.blogPostTranslations)
            .set(t)
            .where(eq(s.blogPostTranslations.id, existingT.id))
        } else {
          await db.insert(s.blogPostTranslations).values({
            id: crypto.randomUUID(),
            postId: id,
            locale: t.locale,
            slug: t.slug,
            title: t.title,
            excerpt: t.excerpt ?? null,
            contentJson: t.contentJson ?? null,
            contentHtml: t.contentHtml ?? null,
          })
        }
      }
    }

    await writeAuditLog({ userId: session.user.id, action: 'UPDATE', entityType: 'BLOG_POST', entityId: id })
    revalidatePath('/admin/blog')

    const [updated] = await db.select().from(s.blogPosts).where(eq(s.blogPosts.id, id)).limit(1)
    return ok(updated, 'Статтю оновлено')
  } catch (e) {
    if (e instanceof z.ZodError) {
      const fieldErrors: Record<string, string[]> = {}
      for (const issue of e.issues) {
        const path = issue.path.join('.')
        if (!fieldErrors[path]) fieldErrors[path] = []
        fieldErrors[path].push(issue.message)
      }
      return fail('Помилка валідації', fieldErrors)
    }
    return fail(e instanceof Error ? e.message : 'Не вдалося оновити статтю')
  }
})

/* ── Delete ── */

export const deleteBlogPost = withCanDelete(async (session, ...args) => {
  try {
    const db = getActionDb()
    const id = args[0] as string
    const [existing] = await db.select().from(s.blogPosts).where(eq(s.blogPosts.id, id)).limit(1)
    if (!existing) return fail('Статтю не знайдено')

    await db.delete(s.blogPosts).where(eq(s.blogPosts.id, id))
    await writeAuditLog({ userId: session.user.id, action: 'DELETE', entityType: 'BLOG_POST', entityId: id })

    revalidatePath('/admin/blog')
    return okVoid('Статтю видалено')
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося видалити статтю')
  }
})

/* ── Publish / status change ── */

export const updateBlogPostStatus = withRole('EDITOR', async (session, ...args) => {
  try {
    const db = getActionDb()
    const id = args[0] as string
    const status = (args[1] ?? 'DRAFT') as 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED'
    const [existing] = await db.select().from(s.blogPosts).where(eq(s.blogPosts.id, id)).limit(1)
    if (!existing) return fail('Статтю не знайдено')

    await db.update(s.blogPosts).set({
      status,
      publishedAt: status === 'PUBLISHED' ? new Date() : existing.publishedAt,
    }).where(eq(s.blogPosts.id, id))

    await writeAuditLog({
      userId: session.user.id,
      action: status === 'PUBLISHED' ? 'PUBLISH' : 'UPDATE',
      entityType: 'BLOG_POST',
      entityId: id,
      before: { status: existing.status },
      after: { status },
    })

    revalidatePath('/admin/blog')
    return okVoid(`Статтю переведено в статус «${status}»`)
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося змінити статус')
  }
})
