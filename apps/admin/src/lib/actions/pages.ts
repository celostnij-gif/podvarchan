'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq, and } from 'drizzle-orm'
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

function now(): string {
  return new Date().toISOString()
}

const PAGE_TYPES = [
  'HOME', 'METHOD', 'ABOUT', 'FAQ', 'CONTACTS', 'PRIVACY', 'DISCLAIMER', 'PRICING', 'CUSTOM',
] as const

const translationSchema = z.object({
  locale: z.enum(['ru', 'uk']),
  slug: z.string().min(1).max(200),
  title: z.string().max(500).optional().default(''),
  contentJson: z.string().optional().default(''),
  excerpt: z.string().optional().default(''),
})

const pageSchema = z.object({
  type: z.enum(PAGE_TYPES).optional().default('CUSTOM'),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional().default('DRAFT'),
  translations: z.array(translationSchema).min(1).max(2),
})

function extractTranslations(formData: FormData) {
  return (['ru', 'uk'] as const)
    .map((locale) => {
      const slug = formData.get(`${locale}_slug`)
      if (slug == null || String(slug).trim() === '') return null
      return {
        locale,
        slug: String(slug).trim(),
        title: String(formData.get(`${locale}_title`) ?? ''),
        contentJson: String(formData.get(`${locale}_contentJson`) ?? ''),
        excerpt: String(formData.get(`${locale}_excerpt`) ?? ''),
      }
    })
    .filter((t): t is NonNullable<typeof t> => t !== null)
}

async function upsertTranslations(
  db: Awaited<ReturnType<typeof getActionDb>>,
  pageId: string,
  translations: z.infer<typeof translationSchema>[],
) {
  for (const t of translations) {
    const existingTr = await db
      .select()
      .from(pageTranslations)
      .where(and(eq(pageTranslations.pageId, pageId), eq(pageTranslations.locale, t.locale)))
      .get()
    if (existingTr) {
      await db
        .update(pageTranslations)
        .set({
          slug: t.slug,
          title: t.title || null,
          contentJson: t.contentJson || null,
          excerpt: t.excerpt || null,
        })
        .where(eq(pageTranslations.id, existingTr.id))
    } else {
      await db.insert(pageTranslations).values({
        id: crypto.randomUUID(),
        pageId,
        locale: t.locale,
        slug: t.slug,
        title: t.title || null,
        contentJson: t.contentJson || null,
        excerpt: t.excerpt || null,
      })
    }
  }
}

/* ── Page CRUD ── */

export async function createPage(formData: FormData) {
  const userId = await requireEdit()
  const db = await getActionDb()
  const translations = extractTranslations(formData)
  const parsed = pageSchema.safeParse({
    type: formData.get('type') || 'CUSTOM',
    sortOrder: formData.get('sortOrder') || 0,
    status: formData.get('status') || 'DRAFT',
    translations,
  })
  if (!parsed.success) throw new Error(`Помилка валідації: ${parsed.error.message}`)
  const data = parsed.data
  const id = crypto.randomUUID()
  const ts = now()

  await db.insert(pages).values({
    id,
    type: data.type,
    sortOrder: data.sortOrder,
    status: data.status,
    createdAt: ts,
    updatedAt: ts,
  })
  await upsertTranslations(db, id, data.translations)
  await writeAuditLog({ userId, action: 'CREATE', entityType: 'PAGE', entityId: id, after: data })
  revalidatePath('/admin/pages')
  revalidatePath('/admin/home')
  redirect(`/admin/pages/${id}`)
}

export async function updatePage(id: string, formData: FormData) {
  const userId = await requireEdit()
  const db = await getActionDb()
  const existing = await db.select().from(pages).where(eq(pages.id, id)).get()
  if (!existing) throw new Error('Сторінку не знайдено')

  const translations = extractTranslations(formData)
  const parsed = pageSchema.safeParse({
    type: formData.get('type') || existing.type,
    sortOrder: formData.get('sortOrder') ?? existing.sortOrder,
    status: formData.get('status') || existing.status,
    translations: translations.length > 0 ? translations : undefined,
  })
  if (!parsed.success) throw new Error(`Помилка валідації: ${parsed.error.message}`)
  if (translations.length === 0) throw new Error('Потрібен хоча б один переклад (slug)')

  const data = parsed.data
  const ts = now()
  await db
    .update(pages)
    .set({
      type: data.type,
      sortOrder: data.sortOrder,
      status: data.status,
      updatedAt: ts,
      publishedAt: data.status === 'PUBLISHED' ? (existing.publishedAt ?? ts) : existing.publishedAt,
    })
    .where(eq(pages.id, id))
  await upsertTranslations(db, id, data.translations)
  await writeAuditLog({
    userId,
    action: 'UPDATE',
    entityType: 'PAGE',
    entityId: id,
    before: existing,
    after: data,
  })
  revalidatePath('/admin/pages')
  revalidatePath(`/admin/pages/${id}`)
  revalidatePath('/admin/home')
  await revalidateSiteLayout('/')
}

/** Primary save from edit form (meta + translations). */
export async function updatePageMeta(id: string, formData: FormData) {
  await updatePage(id, formData)
}

export async function deletePage(id: string) {
  const userId = await requireDelete()
  const db = await getActionDb()
  const existing = await db.select().from(pages).where(eq(pages.id, id)).get()
  if (!existing) throw new Error('Сторінку не знайдено')
  if (existing.type === 'HOME') throw new Error('Головну сторінку не можна видалити')
  await db.delete(pages).where(eq(pages.id, id))
  await writeAuditLog({ userId, action: 'DELETE', entityType: 'PAGE', entityId: id, before: existing })
  revalidatePath('/admin/pages')
  revalidatePath('/admin/home')
  await revalidateSiteLayout('/')
  redirect('/admin/pages')
}

export async function publishPage(id: string) {
  const userId = await requireEdit()
  const db = await getActionDb()
  const existing = await db.select().from(pages).where(eq(pages.id, id)).get()
  if (!existing) throw new Error('Сторінку не знайдено')
  const newStatus = existing.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
  const ts = now()
  await db
    .update(pages)
    .set({
      status: newStatus,
      publishedAt: newStatus === 'PUBLISHED' ? ts : null,
      updatedAt: ts,
    })
    .where(eq(pages.id, id))
  await writeAuditLog({
    userId,
    action: newStatus === 'PUBLISHED' ? 'PUBLISH' : 'UNPUBLISH',
    entityType: 'PAGE',
    entityId: id,
    before: existing,
    after: { status: newStatus },
  })
  revalidatePath('/admin/pages')
  revalidatePath(`/admin/pages/${id}`)
  revalidatePath('/admin/home')
  await revalidateSiteLayout('/')
}

/* ── Home content (structured contentJson) ── */

const homeContentSchema = z.object({
  ru_slug: z.string().min(1).default('/'),
  uk_slug: z.string().min(1).default('/'),
  ru_title: z.string().optional().default(''),
  uk_title: z.string().optional().default(''),
  ru_excerpt: z.string().optional().default(''),
  uk_excerpt: z.string().optional().default(''),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional().default('PUBLISHED'),
  ru_heroTitle: z.string().optional().default(''),
  ru_heroSubtitle: z.string().optional().default(''),
  ru_heroCta: z.string().optional().default(''),
  uk_heroTitle: z.string().optional().default(''),
  uk_heroSubtitle: z.string().optional().default(''),
  uk_heroCta: z.string().optional().default(''),
})

export async function updateHomeContent(formData: FormData) {
  const userId = await requireEdit()
  const db = await getActionDb()

  const home = await db.select().from(pages).where(eq(pages.type, 'HOME')).get()
  if (!home) throw new Error('Сторінка HOME не знайдена в D1')

  const raw = {
    ru_slug: formData.get('ru_slug') ?? '/',
    uk_slug: formData.get('uk_slug') ?? '/',
    ru_title: formData.get('ru_title') ?? '',
    uk_title: formData.get('uk_title') ?? '',
    ru_excerpt: formData.get('ru_excerpt') ?? '',
    uk_excerpt: formData.get('uk_excerpt') ?? '',
    status: formData.get('status') ?? home.status,
    ru_heroTitle: formData.get('ru_heroTitle') ?? '',
    ru_heroSubtitle: formData.get('ru_heroSubtitle') ?? '',
    ru_heroCta: formData.get('ru_heroCta') ?? '',
    uk_heroTitle: formData.get('uk_heroTitle') ?? '',
    uk_heroSubtitle: formData.get('uk_heroSubtitle') ?? '',
    uk_heroCta: formData.get('uk_heroCta') ?? '',
  }
  const parsed = homeContentSchema.safeParse(raw)
  if (!parsed.success) throw new Error(`Помилка валідації: ${parsed.error.message}`)
  const d = parsed.data
  const ts = now()

  await db
    .update(pages)
    .set({
      status: d.status,
      updatedAt: ts,
      publishedAt: d.status === 'PUBLISHED' ? (home.publishedAt ?? ts) : home.publishedAt,
    })
    .where(eq(pages.id, home.id))

  const packs: Array<{ locale: 'ru' | 'uk'; slug: string; title: string; excerpt: string; content: object }> = [
    {
      locale: 'ru',
      slug: d.ru_slug,
      title: d.ru_title,
      excerpt: d.ru_excerpt,
      content: {
        hero: { title: d.ru_heroTitle, subtitle: d.ru_heroSubtitle, cta: d.ru_heroCta },
      },
    },
    {
      locale: 'uk',
      slug: d.uk_slug,
      title: d.uk_title,
      excerpt: d.uk_excerpt,
      content: {
        hero: { title: d.uk_heroTitle, subtitle: d.uk_heroSubtitle, cta: d.uk_heroCta },
      },
    },
  ]

  for (const p of packs) {
    const existingTr = await db
      .select()
      .from(pageTranslations)
      .where(and(eq(pageTranslations.pageId, home.id), eq(pageTranslations.locale, p.locale)))
      .get()
    let base: Record<string, unknown> = {}
    if (existingTr?.contentJson) {
      try {
        base = JSON.parse(existingTr.contentJson) as Record<string, unknown>
      } catch {
        base = {}
      }
    }
    const contentJson = JSON.stringify({ ...base, ...p.content })
    if (existingTr) {
      await db
        .update(pageTranslations)
        .set({
          slug: p.slug,
          title: p.title || null,
          excerpt: p.excerpt || null,
          contentJson,
        })
        .where(eq(pageTranslations.id, existingTr.id))
    } else {
      await db.insert(pageTranslations).values({
        id: crypto.randomUUID(),
        pageId: home.id,
        locale: p.locale,
        slug: p.slug,
        title: p.title || null,
        excerpt: p.excerpt || null,
        contentJson,
      })
    }
  }

  await writeAuditLog({
    userId,
    action: 'UPDATE',
    entityType: 'PAGE',
    entityId: home.id,
    after: { type: 'HOME', ...d },
  })
  revalidatePath('/admin/home')
  revalidatePath('/admin/pages')
  revalidatePath(`/admin/pages/${home.id}`)
  await revalidateSiteLayout('/')
}

/* ── Section schemas ── */

const SECTION_TYPES = [
  'hero',
  'text-block',
  'image-text',
  'stats',
  'timeline',
  'gallery',
  'video-embed',
  'services-grid',
  'faq-group-ref',
  'testimonials-ref',
  'cta',
  'contact-form',
] as const

/* ── Section CRUD ── */

export async function addSection(pageId: string, formData: FormData) {
  const userId = await requireEdit()
  const db = await getActionDb()
  const type = String(formData.get('type') ?? 'text-block')
  const key = String(formData.get('key') ?? '').trim() || `${type}-${Date.now()}`
  if (!SECTION_TYPES.includes(type as (typeof SECTION_TYPES)[number])) {
    throw new Error(`Невідомий тип секції: ${type}`)
  }
  const sortOrder = Number(formData.get('sortOrder') ?? 0) || 0
  const sectionId = crypto.randomUUID()

  await db.insert(pageSections).values({
    id: sectionId,
    pageId,
    key,
    type: type as (typeof SECTION_TYPES)[number],
    enabled: true,
    sortOrder,
    settingsJson: String(formData.get('settings_json') ?? formData.get('settingsJson') ?? '') || null,
  })

  for (const locale of ['ru', 'uk'] as const) {
    const contentJson = formData.get(`${locale}_contentJson`) ?? formData.get(`${locale}_content_json`)
    if (contentJson != null && String(contentJson).length > 0) {
      await db.insert(pageSectionTranslations).values({
        id: crypto.randomUUID(),
        sectionId,
        locale,
        contentJson: String(contentJson),
      })
    }
  }

  await writeAuditLog({
    userId,
    action: 'CREATE',
    entityType: 'PAGE_SECTION',
    entityId: sectionId,
    after: { pageId, key, type },
  })
  revalidatePath(`/admin/pages/${pageId}`)
  revalidatePath('/admin/home')
  await revalidateSiteLayout('/')
}

export async function updateSectionContent(sectionId: string, formData: FormData) {
  const userId = await requireEdit()
  const db = await getActionDb()
  const existing = await db.select().from(pageSections).where(eq(pageSections.id, sectionId)).get()
  if (!existing) throw new Error('Секцію не знайдено')

  const key = formData.get('key') != null ? String(formData.get('key')) : existing.key
  const typeRaw = formData.get('type') != null ? String(formData.get('type')) : existing.type
  const sortOrder =
    formData.get('sortOrder') != null ? Number(formData.get('sortOrder')) : existing.sortOrder

  if (!SECTION_TYPES.includes(typeRaw as (typeof SECTION_TYPES)[number])) {
    throw new Error(`Невідомий тип секції: ${typeRaw}`)
  }

  await db
    .update(pageSections)
    .set({
      key,
      type: typeRaw as (typeof SECTION_TYPES)[number],
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : existing.sortOrder,
    })
    .where(eq(pageSections.id, sectionId))

  // Support both patterns: ru_contentJson / uk_contentJson OR single locale + content_json
  const singleLocale = formData.get('locale')
  if (singleLocale === 'ru' || singleLocale === 'uk') {
    const contentJson = String(
      formData.get('content_json') ?? formData.get('contentJson') ?? formData.get(`${singleLocale}_contentJson`) ?? '',
    )
    await upsertSectionTranslation(db, sectionId, singleLocale, contentJson)
  } else {
    for (const locale of ['ru', 'uk'] as const) {
      const raw =
        formData.get(`${locale}_contentJson`) ??
        formData.get(`${locale}_content_json`)
      if (raw == null) continue
      await upsertSectionTranslation(db, sectionId, locale, String(raw))
    }
  }

  await writeAuditLog({
    userId,
    action: 'UPDATE',
    entityType: 'PAGE_SECTION',
    entityId: sectionId,
    before: existing,
    after: { key, type: typeRaw },
  })
  revalidatePath(`/admin/pages/${existing.pageId}`)
  revalidatePath('/admin/pages')
  revalidatePath('/admin/home')
  await revalidateSiteLayout('/')
}

async function upsertSectionTranslation(
  db: Awaited<ReturnType<typeof getActionDb>>,
  sectionId: string,
  locale: 'ru' | 'uk',
  contentJson: string,
) {
  const existingTr = await db
    .select()
    .from(pageSectionTranslations)
    .where(
      and(eq(pageSectionTranslations.sectionId, sectionId), eq(pageSectionTranslations.locale, locale)),
    )
    .get()
  if (existingTr) {
    await db
      .update(pageSectionTranslations)
      .set({ contentJson: contentJson || null })
      .where(eq(pageSectionTranslations.id, existingTr.id))
  } else {
    await db.insert(pageSectionTranslations).values({
      id: crypto.randomUUID(),
      sectionId,
      locale,
      contentJson: contentJson || null,
    })
  }
}

export async function toggleSection(sectionId: string, enabled: boolean) {
  const userId = await requireEdit()
  const db = await getActionDb()
  const existing = await db.select().from(pageSections).where(eq(pageSections.id, sectionId)).get()
  if (!existing) throw new Error('Секцію не знайдено')
  await db.update(pageSections).set({ enabled }).where(eq(pageSections.id, sectionId))
  await writeAuditLog({
    userId,
    action: 'UPDATE',
    entityType: 'PAGE_SECTION',
    entityId: sectionId,
    before: existing,
    after: { enabled },
  })
  revalidatePath(`/admin/pages/${existing.pageId}`)
  revalidatePath('/admin/home')
  await revalidateSiteLayout('/')
}

export async function reorderSections(pageId: string, orderedIds: string[]) {
  const userId = await requireEdit()
  const db = await getActionDb()
  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(pageSections)
      .set({ sortOrder: i })
      .where(and(eq(pageSections.id, orderedIds[i]), eq(pageSections.pageId, pageId)))
  }
  await writeAuditLog({
    userId,
    action: 'REORDER',
    entityType: 'PAGE_SECTION',
    entityId: pageId,
    after: { orderedIds },
  })
  revalidatePath(`/admin/pages/${pageId}`)
  revalidatePath('/admin/home')
}

export async function deleteSection(sectionId: string) {
  const userId = await requireDelete()
  const db = await getActionDb()
  const existing = await db.select().from(pageSections).where(eq(pageSections.id, sectionId)).get()
  if (!existing) throw new Error('Секцію не знайдено')
  await db.delete(pageSections).where(eq(pageSections.id, sectionId))
  await writeAuditLog({
    userId,
    action: 'DELETE',
    entityType: 'PAGE_SECTION',
    entityId: sectionId,
    before: existing,
  })
  revalidatePath(`/admin/pages/${existing.pageId}`)
  revalidatePath('/admin/home')
  await revalidateSiteLayout('/')
}
