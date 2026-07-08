'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq, and, asc } from 'drizzle-orm'
import { pages, pageTranslations, pageSections, pageSectionTranslations } from '@podvarchan/shared'
import { getCurrentUser } from '@/lib/auth/session'
import { canEditContent, canDelete } from '@/lib/auth/permissions'
import { getActionDb } from './db'
import { writeAuditLog } from '@/lib/audit/log'
import { revalidateSiteLayout } from '@/lib/revalidate'

async function requireEdit(): Promise<string> {
  const user = await getCurrentUser()
  if (!user || !canEditContent(user.role)) throw new Error('Forbidden')
  return user.id
}

async function requireDelete(): Promise<string> {
  const user = await getCurrentUser()
  if (!user || !canDelete(user.role)) throw new Error('Forbidden')
  return user.id
}

async function now(): Promise<string> { return new Date().toISOString() }

/* ── Page schemas ── */

const translationSchema = z.object({
  locale: z.enum(['ru', 'uk']),
  slug: z.string().min(1).max(200),
  title: z.string().min(1).max(500).optional().default(''),
  contentJson: z.string().optional().default(''),
  excerpt: z.string().optional().default(''),
})

const pageSchema = z.object({
  slugPattern: z.string().min(1).max(200).optional().default(''),
  type: z.enum(['HOME', 'METHOD', 'ABOUT', 'FAQ', 'CONTACTS', 'PRIVACY', 'DISCLAIMER', 'CUSTOM']).optional().default('CUSTOM'),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional().default('DRAFT'),
  translations: z.array(translationSchema).min(1).max(2),
})

/* ── Page CRUD ── */

export async function createPage(formData: FormData) {
  const userId = await requireEdit()
  const db = await getActionDb()
  const translations = [
    { locale: 'ru', slug: formData.get('ru_slug'), title: formData.get('ru_title'),
      contentJson: formData.get('ru_contentJson'), excerpt: formData.get('ru_excerpt') },
    { locale: 'uk', slug: formData.get('uk_slug'), title: formData.get('uk_title'),
      contentJson: formData.get('uk_contentJson'), excerpt: formData.get('uk_excerpt') },
  ].filter(t => t.slug)
  const parsed = pageSchema.safeParse({
    slugPattern: formData.get('slugPattern'), type: formData.get('type'),
    sortOrder: formData.get('sortOrder'), status: formData.get('status'), translations,
  })
  if (!parsed.success) throw new Error(`Validation error: ${parsed.error.message}`)
  const data = parsed.data
  const id = crypto.randomUUID()
  const ts = await now()
  await db.insert(pages).values({
    id, slugPattern: data.slugPattern || null, type: data.type,
    sortOrder: data.sortOrder, status: data.status, createdAt: ts, updatedAt: ts,
  })
  for (const t of data.translations) {
    await db.insert(pageTranslations).values({
      id: crypto.randomUUID(), pageId: id, locale: t.locale, slug: t.slug,
      title: t.title || null, contentJson: t.contentJson || null, excerpt: t.excerpt || null,
    })
  }
  await writeAuditLog({ userId, action: 'CREATE', entityType: 'PAGE', entityId: id, after: data })
  revalidatePath('/admin/pages')
  redirect('/admin/pages')
}

export async function updatePage(id: string, formData: FormData) {
  const userId = await requireEdit()
  const db = await getActionDb()
  const existing = await db.select().from(pages).where(eq(pages.id, id)).get()
  if (!existing) throw new Error('Page not found')
  const translations = [
    { locale: 'ru', slug: formData.get('ru_slug'), title: formData.get('ru_title'),
      contentJson: formData.get('ru_contentJson'), excerpt: formData.get('ru_excerpt') },
    { locale: 'uk', slug: formData.get('uk_slug'), title: formData.get('uk_title'),
      contentJson: formData.get('uk_contentJson'), excerpt: formData.get('uk_excerpt') },
  ].filter(t => t.slug)
  const parsed = pageSchema.safeParse({
    slugPattern: formData.get('slugPattern'), type: formData.get('type'),
    sortOrder: formData.get('sortOrder'), status: formData.get('status'), translations,
  })
  if (!parsed.success) throw new Error(`Validation error: ${parsed.error.message}`)
  const data = parsed.data
  const ts = await now()
  await db.update(pages).set({
    slugPattern: data.slugPattern || null, type: data.type,
    sortOrder: data.sortOrder, status: data.status, updatedAt: ts,
  }).where(eq(pages.id, id))
  for (const t of data.translations) {
    const existingTr = await db.select().from(pageTranslations)
      .where(and(eq(pageTranslations.pageId, id), eq(pageTranslations.locale, t.locale))).get()
    if (existingTr) {
      await db.update(pageTranslations).set({
        slug: t.slug, title: t.title || null, contentJson: t.contentJson || null, excerpt: t.excerpt || null,
      }).where(eq(pageTranslations.id, existingTr.id))
    } else {
      await db.insert(pageTranslations).values({
        id: crypto.randomUUID(), pageId: id, locale: t.locale, slug: t.slug,
        title: t.title || null, contentJson: t.contentJson || null, excerpt: t.excerpt || null,
      })
    }
  }
  await writeAuditLog({ userId, action: 'UPDATE', entityType: 'PAGE', entityId: id, before: existing, after: data })
  revalidatePath('/admin/pages')
  redirect('/admin/pages')
}

export async function deletePage(id: string) {
  const userId = await requireDelete()
  const db = await getActionDb()
  const existing = await db.select().from(pages).where(eq(pages.id, id)).get()
  if (!existing) throw new Error('Page not found')
  await db.delete(pages).where(eq(pages.id, id))
  await writeAuditLog({ userId, action: 'DELETE', entityType: 'PAGE', entityId: id, before: existing })
  revalidatePath('/admin/pages')
  redirect('/admin/pages')
}

export async function publishPage(id: string) {
  const userId = await requireEdit()
  const db = await getActionDb()
  const existing = await db.select().from(pages).where(eq(pages.id, id)).get()
  if (!existing) throw new Error('Page not found')
  const newStatus = existing.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
  await db.update(pages).set({
    status: newStatus, publishedAt: newStatus === 'PUBLISHED' ? await now() : null, updatedAt: await now(),
  }).where(eq(pages.id, id))
  await writeAuditLog({ userId, action: newStatus === 'PUBLISHED' ? 'PUBLISH' : 'UNPUBLISH', entityType: 'PAGE', entityId: id, before: existing, after: { status: newStatus } })
  revalidatePath('/admin/pages')
  revalidateSiteLayout('/')
}

/* ── Alias: updatePageMeta (used by forms) → maps to publishPage ── */

export async function updatePageMeta(id: string, formData: FormData) {
  const userId = await requireEdit()
  const db = await getActionDb()
  const existing = await db.select().from(pages).where(eq(pages.id, id)).get()
  if (!existing) throw new Error('Page not found')
  const status = formData.get('status') as string
  const slugPattern = formData.get('slugPattern') as string | null
  const titleRu = formData.get('titleRu') as string | null
  const titleUk = formData.get('titleUk') as string | null
  const ts = await now()

  const updates: Record<string, unknown> = { updatedAt: ts }
  if (status) updates.status = status
  if (slugPattern !== null) updates.slugPattern = slugPattern

  await db.update(pages).set(updates).where(eq(pages.id, id))
  // Update translations
  if (titleRu !== null) {
    await db.update(pageTranslations).set({ title: titleRu }).where(and(eq(pageTranslations.pageId, id), eq(pageTranslations.locale, 'ru')))
  }
  if (titleUk !== null) {
    await db.update(pageTranslations).set({ title: titleUk }).where(and(eq(pageTranslations.pageId, id), eq(pageTranslations.locale, 'uk')))
  }
  await writeAuditLog({ userId, action: 'UPDATE', entityType: 'PAGE', entityId: id, before: existing, after: updates })
  revalidatePath('/admin/pages')
  revalidateSiteLayout('/')
}

/* ── Section schemas ── */

const SECTION_TYPES = [
  'hero', 'text-block', 'image-text', 'stats', 'timeline', 'gallery',
  'video-embed', 'services-grid', 'faq-group-ref', 'testimonials-ref',
  'cta', 'contact-form',
] as const

const sectionSchema = z.object({
  key: z.string().min(1).max(100),
  type: z.enum(SECTION_TYPES),
  contentJson: z.string().optional().default(''),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
})

/* ── Section CRUD ── */

export async function addSection(pageId: string, formData: FormData) {
  const userId = await requireEdit()
  const db = await getActionDb()
  const parsed = sectionSchema.safeParse({
    key: formData.get('key'), type: formData.get('type'),
    contentJson: formData.get('contentJson'), sortOrder: formData.get('sortOrder'),
  })
  if (!parsed.success) throw new Error(`Validation error: ${parsed.error.message}`)
  const data = parsed.data
  const sectionId = crypto.randomUUID()
  await db.insert(pageSections).values({
    id: sectionId, pageId, key: data.key, type: data.type,
    enabled: true, sortOrder: data.sortOrder, settingsJson: null,
  })
  const translations = [
    { locale: 'ru', contentJson: formData.get('ru_contentJson') },
    { locale: 'uk', contentJson: formData.get('uk_contentJson') },
  ].filter(t => t.contentJson)
  for (const t of translations) {
    await db.insert(pageSectionTranslations).values({
      id: crypto.randomUUID(),
      sectionId: sectionId as string,
      locale: t.locale as 'ru' | 'uk',
      contentJson: (t.contentJson as string | null) ?? null,
    } as typeof pageSectionTranslations.$inferInsert)
  }
  await writeAuditLog({ userId, action: 'CREATE', entityType: 'PAGE_SECTION', entityId: sectionId, after: data })
  revalidatePath(`/admin/pages/${pageId}`)
  revalidateSiteLayout('/')
}

export async function updateSectionContent(sectionId: string, formData: FormData) {
  const userId = await requireEdit()
  const db = await getActionDb()
  const existing = await db.select().from(pageSections).where(eq(pageSections.id, sectionId)).get()
  if (!existing) throw new Error('Section not found')
  const parsed = sectionSchema.safeParse({
    key: formData.get('key'), type: formData.get('type'),
    contentJson: formData.get('contentJson'), sortOrder: formData.get('sortOrder'),
  })
  if (!parsed.success) throw new Error(`Validation error: ${parsed.error.message}`)
  const data = parsed.data
  await db.update(pageSections).set({
    key: data.key, type: data.type, sortOrder: data.sortOrder,
  }).where(eq(pageSections.id, sectionId))
  const translations = [
    { locale: 'ru', contentJson: formData.get('ru_contentJson') },
    { locale: 'uk', contentJson: formData.get('uk_contentJson') },
  ].filter(t => t.contentJson)
  for (const t of translations) {
    const existingTr = await db.select().from(pageSectionTranslations)
      .where(and(eq(pageSectionTranslations.sectionId, sectionId), eq(pageSectionTranslations.locale, t.locale as 'ru' | 'uk'))).get()
    if (existingTr) {
      await db.update(pageSectionTranslations).set({ contentJson: (t.contentJson as string | null) ?? null }).where(eq(pageSectionTranslations.id, existingTr.id))
    } else {
      await db.insert(pageSectionTranslations).values({ id: crypto.randomUUID(), sectionId, locale: t.locale as 'ru' | 'uk', contentJson: (t.contentJson as string | null) ?? null } as typeof pageSectionTranslations.$inferInsert)
    }
  }
  await writeAuditLog({ userId, action: 'UPDATE', entityType: 'PAGE_SECTION', entityId: sectionId, before: existing, after: data })
  revalidatePath('/admin/pages')
  revalidateSiteLayout('/')
}

export async function toggleSection(sectionId: string, enabled: boolean) {
  const userId = await requireEdit()
  const db = await getActionDb()
  const existing = await db.select().from(pageSections).where(eq(pageSections.id, sectionId)).get()
  if (!existing) throw new Error('Section not found')
  await db.update(pageSections).set({ enabled }).where(eq(pageSections.id, sectionId))
  await writeAuditLog({ userId, action: 'UPDATE', entityType: 'PAGE_SECTION', entityId: sectionId, before: existing, after: { enabled } })
  revalidatePath('/admin/pages')
  revalidateSiteLayout('/')
}

export async function reorderSections(pageId: string, orderedIds: string[]) {
  const userId = await requireEdit()
  const db = await getActionDb()
  for (let i = 0; i < orderedIds.length; i++) {
    await db.update(pageSections).set({ sortOrder: i }).where(and(eq(pageSections.id, orderedIds[i]), eq(pageSections.pageId, pageId)))
  }
  await writeAuditLog({ userId, action: 'REORDER', entityType: 'PAGE_SECTION', entityId: pageId, after: { orderedIds } })
  revalidatePath('/admin/pages')
}

export async function deleteSection(sectionId: string) {
  const userId = await requireDelete()
  const db = await getActionDb()
  const existing = await db.select().from(pageSections).where(eq(pageSections.id, sectionId)).get()
  if (!existing) throw new Error('Section not found')
  await db.delete(pageSections).where(eq(pageSections.id, sectionId))
  await writeAuditLog({ userId, action: 'DELETE', entityType: 'PAGE_SECTION', entityId: sectionId, before: existing })
  revalidatePath('/admin/pages')
  revalidateSiteLayout('/')
}
