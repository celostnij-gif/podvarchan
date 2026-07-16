'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq, and } from 'drizzle-orm'
import { services, serviceTranslations, redirectRules, seoMeta } from '@podvarchan/shared'
import { getCurrentUser } from '@/lib/auth/session'
import { canEditContent, canDelete, canPublish } from '@/lib/auth/permissions'
import { getActionDb } from './db'
import { writeAuditLog } from '@/lib/audit/log'
import { revalidatePublic, revalidateAdmin, getServiceRevalidatePaths } from '@/lib/revalidate'

async function requireEdit(): Promise<string> {
  const user = await getCurrentUser()
  if (!user || !canEditContent(user.role)) throw new Error('Forbidden')
  return user.id
}

async function requireDelete(): Promise<string> {
  const user = await getCurrentUser()
  if (!user || !canDelete(user.role)) throw new Error('Forbidden — only OWNER can delete')
  return user.id
}


const translationSchema = z.object({
  locale: z.enum(['ru', 'uk']),
  slug: z.string().min(1).max(200),
  title: z.string().min(1).max(300),
  shortTitle: z.string().max(300).optional().default(''),
  description: z.string().max(2000).optional().default(''),
  heroTitle: z.string().max(300).optional().default(''),
  heroSubtitle: z.string().max(500).optional().default(''),
  symptomsJson: z.string().optional().default(''),
  processJson: z.string().optional().default(''),
  benefitsJson: z.string().optional().default(''),
  faqJson: z.string().optional().default(''),
  ctaText: z.string().max(200).optional().default(''),
})

const serviceSchema = z.object({
  slugBase: z.string().min(1).max(200),
  icon: z.string().max(50).optional().default(''),
  category: z.string().max(100).optional().default(''),
  priority: z.coerce.number().int().min(0).optional().default(0),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional().default('DRAFT'),
  featured: z.coerce.boolean().optional().default(false),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
  translations: z.array(translationSchema).min(1).max(2),
})

export type ServiceInput = z.infer<typeof serviceSchema>

async function now(): Promise<string> {
  return new Date().toISOString()
}

function extractFormTranslations(formData: FormData): unknown[] {
  const locales = ['ru', 'uk']
  const translations: unknown[] = []
  for (const locale of locales) {
    const slug = formData.get(`${locale}_slug`)
    if (!slug) continue
    translations.push({
      locale, slug,
      title: formData.get(`${locale}_title`) ?? '',
      shortTitle: formData.get(`${locale}_shortTitle`) ?? '',
      description: formData.get(`${locale}_description`) ?? '',
      heroTitle: formData.get(`${locale}_heroTitle`) ?? '',
      heroSubtitle: formData.get(`${locale}_heroSubtitle`) ?? '',
      symptomsJson: formData.get(`${locale}_symptomsJson`) ?? '',
      processJson: formData.get(`${locale}_processJson`) ?? '',
      benefitsJson: formData.get(`${locale}_benefitsJson`) ?? '',
      faqJson: formData.get(`${locale}_faqJson`) ?? '',
      ctaText: formData.get(`${locale}_ctaText`) ?? '',
    })
  }
  return translations
}

export async function createService(formData: FormData) {
  const userId = await requireEdit()
  const db = await getActionDb()

  const raw: Record<string, unknown> = {
    slugBase: formData.get('slugBase'),
    icon: formData.get('icon'),
    category: formData.get('category'),
    priority: formData.get('priority'),
    status: formData.get('status'),
    featured: formData.get('featured') === 'on',
    sortOrder: formData.get('sortOrder'),
    translations: extractFormTranslations(formData),
  }

  const parsed = serviceSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(`Validation error: ${parsed.error.message}`)
  }

  const data = parsed.data
  const serviceId = crypto.randomUUID()
  const ts = await now()

  // Slug uniqueness
  const existing = await db.select().from(services).where(eq(services.slugBase, data.slugBase)).get()
  if (existing) {
    throw new Error(`Service with slugBase "${data.slugBase}" already exists`)
  }

  await db.insert(services).values({
    id: serviceId, slugBase: data.slugBase, icon: data.icon || null,
    category: data.category || null, priority: data.priority,
    status: data.status, featured: data.featured, sortOrder: data.sortOrder,
    createdAt: ts, updatedAt: ts,
  })

  for (const t of data.translations) {
    await db.insert(serviceTranslations).values({
      id: crypto.randomUUID(), serviceId: serviceId, locale: t.locale,
      slug: t.slug, title: t.title || null, shortTitle: t.shortTitle || null,
      description: t.description || null, heroTitle: t.heroTitle || null,
      heroSubtitle: t.heroSubtitle || null, symptomsJson: t.symptomsJson || null,
      processJson: t.processJson || null, benefitsJson: t.benefitsJson || null,
      faqJson: t.faqJson || null, ctaText: t.ctaText || null,
    })
  }

  await writeAuditLog({ userId, action: 'CREATE', entityType: 'SERVICE', entityId: serviceId, after: data })
  const ruSlug = data.translations.find((t: { locale: string }) => t.locale === 'ru')?.slug || ''
  const ukSlug = data.translations.find((t: { locale: string }) => t.locale === 'uk')?.slug || ''
  revalidateAdmin('/admin/services')
  void revalidatePublic({ paths: getServiceRevalidatePaths(ruSlug, ukSlug, data.featured) })
  redirect('/admin/services')
}

export async function updateService(id: string, formData: FormData) {
  const userId = await requireEdit()
  const db = await getActionDb()

  const existing = await db.select().from(services).where(eq(services.id, id)).get()
  if (!existing) throw new Error('Service not found')

  const raw: Record<string, unknown> = {
    slugBase: formData.get('slugBase'), icon: formData.get('icon'),
    category: formData.get('category'), priority: formData.get('priority'),
    status: formData.get('status'), featured: formData.get('featured') === 'on',
    sortOrder: formData.get('sortOrder'),
    translations: extractFormTranslations(formData),
  }

  const parsed = serviceSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(`Validation error: ${parsed.error.message}`)
  }

  const data = parsed.data

  // If service was PUBLISHED and slug changed → insert 301 redirect
  if (existing.status === 'PUBLISHED') {
    const oldTranslations = await db
      .select()
      .from(serviceTranslations)
      .where(eq(serviceTranslations.serviceId, id))
      .all()
    const redirectTs = await now()
    for (const newT of data.translations) {
      const oldT = oldTranslations.find(t => t.locale === newT.locale)
      if (oldT && oldT.slug !== newT.slug) {
        const oldPath = `/${newT.locale}/uslugi/${oldT.slug}/`
        const newPath = `/${newT.locale}/uslugi/${newT.slug}/`
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

  const duplicate = await db.select().from(services)
    .where(and(eq(services.slugBase, data.slugBase), eq(services.id, id))).get()
  if (!duplicate) {
    const slugConflict = await db.select().from(services)
      .where(eq(services.slugBase, data.slugBase)).get()
    if (slugConflict) throw new Error(`Service with slugBase "${data.slugBase}" already exists`)
  }

  const ts = await now()

  await db.update(services).set({
    slugBase: data.slugBase, icon: data.icon || null, category: data.category || null,
    priority: data.priority, status: data.status, featured: data.featured,
    sortOrder: data.sortOrder, updatedAt: ts,
  }).where(eq(services.id, id))

  // Upsert translations
  for (const t of data.translations) {
    const existingTr = await db.select().from(serviceTranslations)
      .where(and(eq(serviceTranslations.serviceId, id), eq(serviceTranslations.locale, t.locale))).get()
    if (existingTr) {
      await db.update(serviceTranslations).set({
        slug: t.slug, title: t.title || null, shortTitle: t.shortTitle || null,
        description: t.description || null, heroTitle: t.heroTitle || null,
        heroSubtitle: t.heroSubtitle || null, symptomsJson: t.symptomsJson || null,
        processJson: t.processJson || null, benefitsJson: t.benefitsJson || null,
        faqJson: t.faqJson || null, ctaText: t.ctaText || null,
      }).where(and(eq(serviceTranslations.serviceId, id), eq(serviceTranslations.locale, t.locale)))
    } else {
      await db.insert(serviceTranslations).values({
        id: crypto.randomUUID(), serviceId: id, locale: t.locale, slug: t.slug,
        title: t.title || null, shortTitle: t.shortTitle || null,
        description: t.description || null, heroTitle: t.heroTitle || null,
        heroSubtitle: t.heroSubtitle || null, symptomsJson: t.symptomsJson || null,
        processJson: t.processJson || null, benefitsJson: t.benefitsJson || null,
        faqJson: t.faqJson || null, ctaText: t.ctaText || null,
      })
    }
  }

  await writeAuditLog({ userId, action: 'UPDATE', entityType: 'SERVICE', entityId: id, before: existing, after: data })
  const ruSlug = data.translations.find((t: { locale: string }) => t.locale === 'ru')?.slug || ''
  const ukSlug = data.translations.find((t: { locale: string }) => t.locale === 'uk')?.slug || ''
  revalidateAdmin('/admin/services', `/admin/services/${id}`)
  void revalidatePublic({ paths: getServiceRevalidatePaths(ruSlug, ukSlug, data.featured) })
  redirect('/admin/services')
}

export async function deleteService(id: string) {
  const userId = await requireDelete()
  const db = await getActionDb()

  const existing = await db.select().from(services).where(eq(services.id, id)).get()
  if (!existing) throw new Error('Service not found')

  await db.delete(services).where(eq(services.id, id))
  await writeAuditLog({ userId, action: 'DELETE', entityType: 'SERVICE', entityId: id, before: existing })
  revalidateAdmin('/admin/services')
  void revalidatePublic({ paths: ['/ru/uslugi/', '/uk/uslugi/', '/sitemap.xml'], type: 'layout' })
  redirect('/admin/services')
}

export async function publishService(id: string) {
  const userId = await requireEdit()
  const db = await getActionDb()

  const existing = await db.select().from(services).where(eq(services.id, id)).get()
  if (!existing) throw new Error('Service not found')

  const newStatus = existing.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'

  // YMYL: only OWNER/ADMIN can publish
  if (newStatus === 'PUBLISHED') {
    const user = await getCurrentUser()
    if (!user || !canPublish(user.role)) throw new Error('Only OWNER or ADMIN can publish')

    const translations = await db
      .select()
      .from(serviceTranslations)
      .where(eq(serviceTranslations.serviceId, id))
      .all()

    const ruTr = translations.find(t => t.locale === 'ru')
    const ukTr = translations.find(t => t.locale === 'uk')

    if (!ruTr?.title || !ruTr?.slug) throw new Error('RU translation must have non-empty title and slug')
    if (!ukTr?.title || !ukTr?.slug) throw new Error('UK translation must have non-empty title and slug')

    // Require meta description
    const meta = ruTr.seoMetaId
      ? await db.select().from(seoMeta).where(eq(seoMeta.id, ruTr.seoMetaId)).get()
      : null
    const hasMetaDesc = meta?.description && meta.description.length > 0
    const hasDesc = ruTr.description && ruTr.description.length >= 50
    if (!hasMetaDesc && !hasDesc) throw new Error('Service must have a meta description (seo_meta.description or description >= 50 chars)')
  }

  await db.update(services).set({ status: newStatus, updatedAt: await now() }).where(eq(services.id, id))
  await writeAuditLog({ userId, action: newStatus === 'PUBLISHED' ? 'PUBLISH' : 'UNPUBLISH',
    entityType: 'SERVICE', entityId: id, after: { status: newStatus },
  })
  revalidateAdmin('/admin/services')
  void revalidatePublic({ paths: ['/ru/uslugi/', '/uk/uslugi/', '/sitemap.xml'], type: 'layout' })
}

/* ── Reorder (drag-and-drop) ── */
export async function reorderServices(orderedIds: string[]) {
  await requireEdit()
  const db = await getActionDb()
  for (let i = 0; i < orderedIds.length; i++) {
    await db.update(services).set({ sortOrder: i }).where(eq(services.id, orderedIds[i]))
  }
  revalidateAdmin('/admin/services')
  void revalidatePublic({ paths: ['/ru/uslugi/', '/uk/uslugi/', '/sitemap.xml'], type: 'layout' })
}
