'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getDB } from '@/db'
import { pages, pageTranslations, pageSections, pageSectionTranslations } from '@/db/schema/pages'
import { auditLogs } from '@/db/schema/auth'
import { getCurrentUser } from '@/lib/auth/session'
import { canEditContent, canDelete } from '@/lib/auth/permissions'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import type { UserRole } from '@/lib/auth/permissions'

/* ── Validation schemas ── */

const translationSchema = z.object({
  locale: z.enum(['ru', 'uk']),
  slug: z.string().min(1).max(200),
  title: z.string().max(300).optional().default(''),
  excerpt: z.string().max(2000).optional().default(''),
  seoMetaId: z.string().optional().default(''),
})

const pageSchema = z.object({
  type: z.enum(['CUSTOM']),
  slugPattern: z.string().optional().default(''),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional().default('DRAFT'),
  sortOrder: z.coerce.number().optional().default(0),
  translations: z.array(translationSchema).min(1),
})

export type PageInput = z.infer<typeof pageSchema>

/* ── Auth helpers ── */

async function requireEdit(): Promise<{ id: string; role: UserRole }> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  if (!canEditContent(user.role)) throw new Error('Forbidden')
  return { id: user.id, role: user.role }
}

function now(): string {
  return new Date().toISOString()
}

function uid(): string {
  return randomUUID()
}

/* ── Helpers ── */

interface PageTranslationRecord {
  id: string
  pageId: string
  locale: 'ru' | 'uk'
  slug: string
  title: string | null
  excerpt: string | null
  contentJson: string | null
  seoMetaId: string | null
}

export interface PageWithTranslations {
  id: string
  type: string
  slugPattern: string | null
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  sortOrder: number
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  translations: PageTranslationRecord[]
  sections: PageSectionWithTranslations[]
}

interface PageSectionRecord {
  id: string
  pageId: string
  key: string
  type: string
  enabled: boolean
  sortOrder: number
  settingsJson: string | null
}

interface PageSectionTranslationRecord {
  id: string
  sectionId: string
  locale: 'ru' | 'uk'
  contentJson: string | null
}

export interface PageSectionWithTranslations {
  section: PageSectionRecord
  translations: PageSectionTranslationRecord[]
}

/* ── Actions ── */

export async function createPage(formData: FormData) {
  const user = await requireEdit()
  const db = getDB()

  // Build translations from form data
  const locales = ['ru', 'uk'] as const
  const translations = locales.map((locale) => ({
    locale,
    slug: formData.get(`${locale}_slug`) as string || '',
    title: formData.get(`${locale}_title`) as string || '',
    excerpt: formData.get(`${locale}_excerpt`) as string || '',
  }))

  const raw = {
    type: 'CUSTOM',
    slugPattern: formData.get('slug_pattern') as string || '',
    status: (formData.get('status') as string) || 'DRAFT',
    sortOrder: Number(formData.get('sort_order')) || 0,
    translations,
  }

  const parsed = pageSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(`Validation error: ${parsed.error.message}`)
  }

  const { data } = parsed
  const id = uid()
  const publishedAt = data.status === 'PUBLISHED' ? now() : null

  await db.insert(pages).values({
    id,
    type: data.type,
    slugPattern: data.slugPattern || null,
    status: data.status,
    sortOrder: data.sortOrder,
    publishedAt,
    createdAt: now(),
    updatedAt: now(),
  })

  for (const t of data.translations) {
    await db.insert(pageTranslations).values({
      id: uid(),
      pageId: id,
      locale: t.locale,
      slug: t.slug,
      title: t.title || null,
      excerpt: t.excerpt || null,
      seoMetaId: t.seoMetaId || null,
    })
  }

  await db.insert(auditLogs).values({
    id: uid(),
    userId: user.id,
    action: 'CREATE',
    entityType: 'page',
    entityId: id,
    afterJson: JSON.stringify({ type: data.type }),
    createdAt: now(),
  })

  revalidatePath('/admin/pages')
  redirect(`/admin/pages/${id}`)
}

export async function updatePageMeta(id: string, formData: FormData) {
  const user = await requireEdit()
  const db = getDB()

  const status = formData.get('status') as string || 'DRAFT'
  const slugPattern = formData.get('slug_pattern') as string || ''

  const page = await db.select().from(pages).where(eq(pages.id, id)).get()
  if (!page) throw new Error('Page not found')

  const publishedAt = status === 'PUBLISHED' && page.status !== 'PUBLISHED' ? now() : page.status === 'PUBLISHED' && status !== 'PUBLISHED' ? null : page.publishedAt

  await db.update(pages)
    .set({
      slugPattern: slugPattern || null,
      status: status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
      publishedAt,
      updatedAt: now(),
    })
    .where(eq(pages.id, id))

  // Update translations
  const locales = ['ru', 'uk'] as const
  for (const locale of locales) {
    const slug = formData.get(`${locale}_slug`) as string
    const title = formData.get(`${locale}_title`) as string
    const excerpt = formData.get(`${locale}_excerpt`) as string
    if (!slug) continue

    const existing = await db
      .select()
      .from(pageTranslations)
      .where(and(eq(pageTranslations.pageId, id), eq(pageTranslations.locale, locale)))
      .get()

    if (existing) {
      await db.update(pageTranslations)
        .set({
          slug,
          title: title || null,
          excerpt: excerpt || null,
        })
        .where(eq(pageTranslations.id, existing.id))
    } else {
      await db.insert(pageTranslations).values({
        id: uid(),
        pageId: id,
        locale,
        slug,
        title: title || null,
        excerpt: excerpt || null,
      })
    }
  }

  await db.insert(auditLogs).values({
    id: uid(),
    userId: user.id,
    action: 'UPDATE',
    entityType: 'page',
    entityId: id,
    afterJson: JSON.stringify({ status }),
    createdAt: now(),
  })

  revalidatePath('/admin/pages')
  revalidatePath(`/admin/pages/${id}`)
  revalidatePath(`/${formData.get('ru_slug') as string || ''}`)
  revalidatePath(`/${formData.get('uk_slug') as string || ''}`)
}

export async function deletePage(id: string) {
  const user = await requireEdit()
  if (!canDelete(user.role)) throw new Error('Forbidden')
  const db = getDB()

  // Cascade delete: sections + translations are handled by DB foreign keys
  await db.delete(pages).where(eq(pages.id, id))

  await db.insert(auditLogs).values({
    id: uid(),
    userId: user.id,
    action: 'DELETE',
    entityType: 'page',
    entityId: id,
    createdAt: now(),
  })

  revalidatePath('/admin/pages')
  redirect('/admin/pages')
}

/* ── Section actions ── */

const SECTION_TYPES = [
  'hero', 'text-block', 'image-text', 'stats', 'timeline', 'gallery',
  'video-embed', 'services-grid', 'faq-group-ref', 'testimonials-ref',
  'cta', 'contact-form',
] as const

const sectionSchema = z.object({
  type: z.enum(SECTION_TYPES),
  key: z.string().min(1).max(100),
  settingsJson: z.string().optional().default('{}'),
})

export async function addSection(pageId: string, formData: FormData) {
  const user = await requireEdit()
  const db = getDB()

  const raw = {
    type: formData.get('type') as string,
    key: formData.get('key') as string,
    settingsJson: formData.get('settings_json') as string || '{}',
  }

  const parsed = sectionSchema.safeParse(raw)
  if (!parsed.success) throw new Error(`Validation error: ${parsed.error.message}`)

  // Determine sort order
  const existing = await db
    .select()
    .from(pageSections)
    .where(eq(pageSections.pageId, pageId))
    .all()

  const nextOrder = existing.reduce((max, s) => Math.max(max, s.sortOrder), -1) + 1

  const sectionId = uid()
  await db.insert(pageSections).values({
    id: sectionId,
    pageId,
    key: parsed.data.key,
    type: parsed.data.type,
    enabled: true,
    sortOrder: nextOrder,
    settingsJson: parsed.data.settingsJson || null,
  })

  // Create empty translations for each locale
  for (const locale of ['ru', 'uk'] as const) {
    await db.insert(pageSectionTranslations).values({
      id: uid(),
      sectionId,
      locale,
      contentJson: null,
    })
  }

  await db.insert(auditLogs).values({
    id: uid(),
    userId: user.id,
    action: 'CREATE',
    entityType: 'page_section',
    entityId: sectionId,
    afterJson: JSON.stringify({ pageId, type: parsed.data.type }),
    createdAt: now(),
  })
}



export async function updateSectionContent(sectionId: string, formData: FormData) {
  const user = await requireEdit()
  const db = getDB()

  const locale = formData.get('locale') as string

  const existing = await db
    .select()
    .from(pageSectionTranslations)
    .where(and(eq(pageSectionTranslations.sectionId, sectionId), eq(pageSectionTranslations.locale, locale as 'ru' | 'uk')))
    .get()

  const contentJson = formData.get('content_json') as string || null

  if (existing) {
    await db.update(pageSectionTranslations)
      .set({ contentJson: contentJson || null })
      .where(eq(pageSectionTranslations.id, existing.id))
  }

  revalidatePath(`/admin/pages/${formData.get('page_id') as string || ''}`)
}

export async function toggleSection(sectionId: string, enabled: boolean) {
  await requireEdit()
  const db = getDB()

  await db.update(pageSections)
    .set({ enabled })
    .where(eq(pageSections.id, sectionId))

  revalidatePath('/admin/pages')
}

export async function reorderSections(pageId: string, orderedIds: string[]) {
  await requireEdit()
  const db = getDB()

  for (let i = 0; i < orderedIds.length; i++) {
    await db.update(pageSections)
      .set({ sortOrder: i })
      .where(and(eq(pageSections.id, orderedIds[i]), eq(pageSections.pageId, pageId)))
  }

  revalidatePath(`/admin/pages/${pageId}`)
}

export async function deleteSection(sectionId: string) {
  const user = await requireEdit()
  if (!canDelete(user.role)) throw new Error('Forbidden')

  const db = getDB()
  await db.delete(pageSections).where(eq(pageSections.id, sectionId))

  await db.insert(auditLogs).values({
    id: uid(),
    userId: user.id,
    action: 'DELETE',
    entityType: 'page_section',
    entityId: sectionId,
    createdAt: now(),
  })

  revalidatePath('/admin/pages')
}
