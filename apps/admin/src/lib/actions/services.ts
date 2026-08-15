'use server'
import { cleanUpdate } from './clean-update'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'

import { eq, and } from 'drizzle-orm'
import { services, serviceTranslations, redirectRules, seoMeta, serviceIndexPath, servicePath } from '@podvarchan/shared'
import { getCurrentUser } from '@/lib/auth/session'
import { canEditContent } from '@/lib/auth/permissions'
import { requireDelete } from '@/lib/auth/guards'
import { getActionDb } from './db'
import { writeAuditLog } from '@/lib/audit/log'
import { revalidatePublic, revalidateAdmin, getServiceRevalidatePaths, getServiceCacheKeys, cacheKeys } from '@/lib/revalidate'
import { syncRedirectRulesToKv } from './redirects'
import { requirePublish, assertBilingual, assertMetaPresent } from './ymyl'

async function requireEdit(): Promise<string> {
  const user = await getCurrentUser()
  if (!user || !canEditContent(user.role)) throw new Error('Заборонено')
  return user.id
}


const translationSchema = z.object({
  locale: z.enum(['ru', 'uk']),
  slug: z.string().min(1).max(200),
  title: z.string().min(1).max(300),
  shortTitle: z.string().max(300).optional().default(''),
  description: z.string().max(2000).optional().default(''),
  contentHtml: z.string().optional().default(''),
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
    const title = formData.get(`${locale}_title`)
    if (!slug || !title) continue
    translations.push({
      locale,
      slug,
      title,
      shortTitle: formData.get(`${locale}_shortTitle`) ?? '',
      description: formData.get(`${locale}_description`) ?? '',
      contentHtml: formData.get(`${locale}_contentHtml`) ?? '',
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
    throw new Error(`Помилка валідації: ${parsed.error.message}`)
  }

  const data = parsed.data
  if (data.status === 'PUBLISHED') {
    await requirePublish()
    const ruTr = data.translations.find((t) => t.locale === 'ru')
    const ukTr = data.translations.find((t) => t.locale === 'uk')
    assertBilingual(ruTr, ukTr, 'Service')
    await assertMetaPresent(ruTr!, db, 'Service')
  }
  const serviceId = crypto.randomUUID()
  const ts = await now()

  // Slug uniqueness
  const existing = await db.select().from(services).where(eq(services.slugBase, data.slugBase)).get()
  if (existing) {
    throw new Error(`Послуга з slugBase "${data.slugBase}" вже існує`)
  }

  await db.insert(services).values(cleanUpdate({
    id: serviceId, slugBase: data.slugBase, icon: data.icon,
    category: data.category, priority: data.priority,
    status: data.status, featured: data.featured, sortOrder: data.sortOrder,
    createdAt: ts, updatedAt: ts,
  }))

  for (const t of data.translations) {
    await db.insert(serviceTranslations).values(cleanUpdate({
      id: crypto.randomUUID(), serviceId: serviceId, locale: t.locale,
      slug: t.slug, title: t.title, shortTitle: t.shortTitle,
      description: t.description, contentHtml: t.contentHtml,
      heroTitle: t.heroTitle, heroSubtitle: t.heroSubtitle,
      symptomsJson: t.symptomsJson, processJson: t.processJson,
      benefitsJson: t.benefitsJson, faqJson: t.faqJson,
      ctaText: t.ctaText,
    }))
  }

  await writeAuditLog({ userId, action: 'CREATE', entityType: 'SERVICE', entityId: serviceId, after: data })
  const ruSlug = data.translations.find((t: { locale: string }) => t.locale === 'ru')?.slug || ''
  const ukSlug = data.translations.find((t: { locale: string }) => t.locale === 'uk')?.slug || ''
  revalidateAdmin('/admin/services')
  await revalidatePublic({
    paths: getServiceRevalidatePaths(ruSlug, ukSlug, data.featured),
    keys: getServiceCacheKeys(ruSlug, ukSlug, serviceId, data.featured),
  })
  
}

export async function updateService(id: string, formData: FormData) {
  const userId = await requireEdit()
  const db = await getActionDb()

  const existing = await db.select().from(services).where(eq(services.id, id)).get()
  if (!existing) throw new Error('Послугу не знайдено')

  const raw: Record<string, unknown> = {
    slugBase: formData.get('slugBase'), icon: formData.get('icon'),
    category: formData.get('category'), priority: formData.get('priority'),
    status: formData.get('status'), featured: formData.get('featured') === 'on',
    sortOrder: formData.get('sortOrder'),
    translations: extractFormTranslations(formData),
  }

  const parsed = serviceSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(`Помилка валідації: ${parsed.error.message}`)
  }

  const data = parsed.data
  if (data.status === 'PUBLISHED') {
    await requirePublish()
    const ruTr = data.translations.find((t) => t.locale === 'ru')
    const ukTr = data.translations.find((t) => t.locale === 'uk')
    assertBilingual(ruTr, ukTr, 'Service')
    const existingRu = await db
      .select({ seoMetaId: serviceTranslations.seoMetaId })
      .from(serviceTranslations)
      .where(and(eq(serviceTranslations.serviceId, id), eq(serviceTranslations.locale, 'ru')))
      .get()
    await assertMetaPresent({ ...ruTr, seoMetaId: existingRu?.seoMetaId ?? null }, db, 'Service')
  }

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
        const oldPath = servicePath(newT.locale, oldT.slug)
        const newPath = servicePath(newT.locale, newT.slug)
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

  const duplicate = await db.select().from(services)
    .where(and(eq(services.slugBase, data.slugBase), eq(services.id, id))).get()
  if (!duplicate) {
    const slugConflict = await db.select().from(services)
      .where(eq(services.slugBase, data.slugBase)).get()
    if (slugConflict) throw new Error(`Послуга з slugBase "${data.slugBase}" вже існує`)
  }

  const ts = await now()

  await db.update(services).set({
    slugBase: data.slugBase, priority: data.priority, status: data.status,
    featured: data.featured, sortOrder: data.sortOrder, updatedAt: ts,
    ...(data.icon ? { icon: data.icon } : {}),
    ...(data.category ? { category: data.category } : {}),
  }).where(eq(services.id, id))



  // Upsert translations
  for (const t of data.translations) {
    const existingTr = await db.select().from(serviceTranslations)
      .where(and(eq(serviceTranslations.serviceId, id), eq(serviceTranslations.locale, t.locale))).get()
    if (existingTr) {
      await db.update(serviceTranslations).set(cleanUpdate({
        slug: t.slug, title: t.title, shortTitle: t.shortTitle,
        description: t.description, contentHtml: t.contentHtml,
        heroTitle: t.heroTitle, heroSubtitle: t.heroSubtitle,
        symptomsJson: t.symptomsJson, processJson: t.processJson,
        benefitsJson: t.benefitsJson, faqJson: t.faqJson,
        ctaText: t.ctaText,
      })).where(and(eq(serviceTranslations.serviceId, id), eq(serviceTranslations.locale, t.locale)))
    } else {
      await db.insert(serviceTranslations).values(cleanUpdate({
        id: crypto.randomUUID(), serviceId: id, locale: t.locale, slug: t.slug,
        title: t.title, shortTitle: t.shortTitle,
        description: t.description, contentHtml: t.contentHtml,
        heroTitle: t.heroTitle, heroSubtitle: t.heroSubtitle,
        symptomsJson: t.symptomsJson, processJson: t.processJson,
        benefitsJson: t.benefitsJson, faqJson: t.faqJson,
        ctaText: t.ctaText,
      }))
    }
  }

  await writeAuditLog({ userId, action: 'UPDATE', entityType: 'SERVICE', entityId: id, before: existing, after: data })
  const ruSlug = data.translations.find((t: { locale: string }) => t.locale === 'ru')?.slug || ''
  const ukSlug = data.translations.find((t: { locale: string }) => t.locale === 'uk')?.slug || ''
  const oldTrs = await db
    .select()
    .from(serviceTranslations)
    .where(eq(serviceTranslations.serviceId, id))
    .all()
  const oldRuSlug = oldTrs.find((t) => t.locale === 'ru')?.slug || ''
  const oldUkSlug = oldTrs.find((t) => t.locale === 'uk')?.slug || ''
  revalidateAdmin('/admin/services', `/admin/services/${id}`)
  await revalidatePublic({
    paths: getServiceRevalidatePaths(ruSlug, ukSlug, data.featured || existing.featured),
    keys: [
      ...getServiceCacheKeys(ruSlug, ukSlug, id, data.featured || existing.featured),
      ...(oldRuSlug && oldRuSlug !== ruSlug ? [cacheKeys.service(oldRuSlug, 'ru')] : []),
      ...(oldUkSlug && oldUkSlug !== ukSlug ? [cacheKeys.service(oldUkSlug, 'uk')] : []),
    ],
  })
  
}

export async function deleteService(id: string) {
  const { id: userId } = await requireDelete()
  const db = await getActionDb()

  const existing = await db.select().from(services).where(eq(services.id, id)).get()
  if (!existing) throw new Error('Послугу не знайдено')

  // Capture slugs before the cascade delete removes translations.
  const delTrs = await db
    .select()
    .from(serviceTranslations)
    .where(eq(serviceTranslations.serviceId, id))
    .all()
  const ruSlug = delTrs.find((t) => t.locale === 'ru')?.slug || ''
  const ukSlug = delTrs.find((t) => t.locale === 'uk')?.slug || ''

  // seo_meta has no FK — delete linked rows in the same transaction (P0-2).
  await db.transaction(async (tx) => {
    await tx.delete(seoMeta).where(and(eq(seoMeta.entityType, 'service'), eq(seoMeta.entityId, id)))
    await tx.delete(services).where(eq(services.id, id))
  })

  await writeAuditLog({ userId, action: 'DELETE', entityType: 'SERVICE', entityId: id, before: existing })
  revalidateAdmin('/admin/services')
  await revalidatePublic({
    paths: [serviceIndexPath('ru'), serviceIndexPath('uk'), '/sitemap.xml'],
    type: 'layout',
    keys: getServiceCacheKeys(ruSlug, ukSlug, id, existing.featured),
  })
}

export async function publishService(id: string) {
  const userId = await requireEdit()
  const db = await getActionDb()

  const existing = await db.select().from(services).where(eq(services.id, id)).get()
  if (!existing) throw new Error('Послугу не знайдено')

  const newStatus = existing.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'

  // YMYL: only OWNER/ADMIN can publish
  if (newStatus === 'PUBLISHED') {
    await requirePublish()

    const translations = await db
      .select()
      .from(serviceTranslations)
      .where(eq(serviceTranslations.serviceId, id))
      .all()

    const ruTr = translations.find(t => t.locale === 'ru')
    const ukTr = translations.find(t => t.locale === 'uk')

    assertBilingual(ruTr, ukTr, 'Послуга')
    await assertMetaPresent(ruTr!, db, 'Послуга')
  }

  await db.update(services).set({ status: newStatus, updatedAt: await now() }).where(eq(services.id, id))
  await writeAuditLog({ userId, action: newStatus === 'PUBLISHED' ? 'PUBLISH' : 'UNPUBLISH',
    entityType: 'SERVICE', entityId: id, after: { status: newStatus },
  })
  revalidateAdmin('/admin/services')
  const pubTrs = await db
    .select()
    .from(serviceTranslations)
    .where(eq(serviceTranslations.serviceId, id))
    .all()
  const ruSlug = pubTrs.find((t) => t.locale === 'ru')?.slug || ''
  const ukSlug = pubTrs.find((t) => t.locale === 'uk')?.slug || ''
  await revalidatePublic({
    paths: [serviceIndexPath('ru'), serviceIndexPath('uk'), '/sitemap.xml'],
    type: 'layout',
    keys: getServiceCacheKeys(ruSlug, ukSlug, id, existing.featured),
  })
}

/* ── Reorder (drag-and-drop) ── */
export async function reorderServices(orderedIds: string[]) {
  await requireEdit()
  const db = await getActionDb()
  for (let i = 0; i < orderedIds.length; i++) {
    await db.update(services).set({ sortOrder: i }).where(eq(services.id, orderedIds[i]))
  }
  revalidateAdmin('/admin/services')
  await revalidatePublic({
    paths: [serviceIndexPath('ru'), serviceIndexPath('uk'), '/sitemap.xml'],
    type: 'layout',
    keys: [cacheKeys.servicesList('ru'), cacheKeys.servicesList('uk'), cacheKeys.servicesSidebar('ru'), cacheKeys.servicesSidebar('uk')],
  })
}
