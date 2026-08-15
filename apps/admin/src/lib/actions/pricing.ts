'use server'
import { cleanUpdate } from './clean-update'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'

import { eq } from 'drizzle-orm'
import { pricingPlans, pricingPlanTranslations, cacheKeys, seoMeta } from '@podvarchan/shared'
import { getCurrentUser } from '@/lib/auth/session'
import { canEditContent } from '@/lib/auth/permissions'
import { requireDelete } from '@/lib/auth/guards'
import { getActionDb } from './db'
import { writeAuditLog } from '@/lib/audit/log'
import { revalidatePublic, revalidateAdmin } from '@/lib/revalidate'

async function requireEdit(): Promise<string> {
  const user = await getCurrentUser()
  if (!user || !canEditContent(user.role)) throw new Error('Заборонено')
  return user.id
}

async function now(): Promise<string> { return new Date().toISOString() }

const PLAN_KEYS = ['free', 'single', 'premium', 'elite'] as const

const translationSchema = z.object({
  locale: z.enum(['ru', 'uk']),
  title: z.string().min(1, 'Назва обовʼязкова'),
  subtitle: z.string().optional().default(''),
  description: z.string().optional().default(''),
  badge: z.string().nullable().optional().default(null),
  features: z.array(z.string()).optional().default([]),
})

const planSchema = z.object({
  key: z.enum(PLAN_KEYS),
  price: z.coerce.number().int().min(0, 'Ціна не може бути відʼємною'),
  oldPrice: z.coerce.number().int().min(0).nullable().optional().default(null),
  currency: z.string().optional().default('USD'),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional().default('PUBLISHED'),
  translations: z.array(translationSchema).min(1).max(2),
})

function extractTranslations(formData: FormData): z.infer<typeof translationSchema>[] {
  const translations: z.infer<typeof translationSchema>[] = []
  for (const locale of ['ru', 'uk'] as const) {
    const featuresRaw = formData.get(`${locale}_features`)
    const features = typeof featuresRaw === 'string' && featuresRaw.trim()
      ? featuresRaw.split('\n').map((f) => f.trim()).filter(Boolean)
      : []
    translations.push({
      locale,
      title: String(formData.get(`${locale}_title`) ?? '').trim(),
      subtitle: String(formData.get(`${locale}_subtitle`) ?? '').trim(),
      description: String(formData.get(`${locale}_description`) ?? '').trim(),
      badge: String(formData.get(`${locale}_badge`) ?? '').trim() || null,
      features,
    })
  }
  return translations
}

/** Инвалидация прайса: страницы цен (обе локали) + агрегаты с ценами (llms). */
async function revalidatePricing(): Promise<void> {
  revalidateAdmin('/admin/pricing')
  await revalidatePublic({
    paths: ['/ru/tseny/', '/uk/tsiny/', '/llms.txt', '/llms-full.txt'],
    keys: [cacheKeys.pricingList('ru'), cacheKeys.pricingList('uk')],
  })
}

export async function createPricingPlan(formData: FormData) {
  const userId = await requireEdit()
  const db = await getActionDb()
  const translations = extractTranslations(formData)
  const parsed = planSchema.safeParse({
    key: String(formData.get('key') ?? ''),
    price: Number(formData.get('price') ?? 0),
    oldPrice: formData.get('old_price') ? Number(formData.get('old_price')) : null,
    currency: String(formData.get('currency') ?? 'USD') || 'USD',
    sortOrder: Number(formData.get('sort_order') ?? 0),
    status: String(formData.get('status') ?? 'PUBLISHED'),
    translations,
  })
  if (!parsed.success) throw new Error(`Помилка валідації: ${parsed.error.message}`)
  const data = parsed.data

  const id = crypto.randomUUID()
  const ts = await now()
  await db.insert(pricingPlans).values(cleanUpdate({
    id,
    key: data.key,
    price: data.price,
    oldPrice: data.oldPrice,
    currency: data.currency,
    sortOrder: data.sortOrder,
    status: data.status,
    createdAt: ts,
    updatedAt: ts,
  }))
  for (const t of data.translations) {
    await upsertTranslation(db, id, t, ts)
  }
  revalidatePricing()
}

export async function updatePricingPlan(id: string, formData: FormData) {
  const userId = await requireEdit()
  const db = await getActionDb()
  const translations = extractTranslations(formData)
  const parsed = planSchema.safeParse({
    key: String(formData.get('key') ?? ''),
    price: Number(formData.get('price') ?? 0),
    oldPrice: formData.get('old_price') ? Number(formData.get('old_price')) : null,
    currency: String(formData.get('currency') ?? 'USD') || 'USD',
    sortOrder: Number(formData.get('sort_order') ?? 0),
    status: String(formData.get('status') ?? 'PUBLISHED'),
    translations,
  })
  if (!parsed.success) throw new Error(`Помилка валідації: ${parsed.error.message}`)
  const data = parsed.data

  const existing = await db.select({ id: pricingPlans.id }).from(pricingPlans).where(eq(pricingPlans.id, id)).get()
  if (!existing) throw new Error('План не знайдено')

  const ts = await now()
  await db.update(pricingPlans).set(cleanUpdate({
    key: data.key,
    price: data.price,
    oldPrice: data.oldPrice,
    currency: data.currency,
    sortOrder: data.sortOrder,
    status: data.status,
    updatedAt: ts,
  })).where(eq(pricingPlans.id, id))

  for (const t of data.translations) {
    await upsertTranslation(db, id, t, ts)
  }
  await writeAuditLog({ userId, action: 'UPDATE', entityType: 'PRICING_PLAN', entityId: id, after: data })
  revalidatePricing()
}

async function upsertTranslation(
  db: Awaited<ReturnType<typeof getActionDb>>,
  planId: string,
  t: z.infer<typeof translationSchema>,
  ts: string,
) {
  const trId = `${planId}-${t.locale}`
  const existing = await db
    .select({ id: pricingPlanTranslations.id })
    .from(pricingPlanTranslations)
    .where(eq(pricingPlanTranslations.id, trId))
    .get()
  if (existing) {
    await db.update(pricingPlanTranslations).set(cleanUpdate({
      title: t.title,
      subtitle: t.subtitle || null,
      description: t.description || null,
      badge: t.badge,
      featuresJson: t.features.length > 0 ? JSON.stringify(t.features) : null,
    })).where(eq(pricingPlanTranslations.id, trId))
  } else {
    await db.insert(pricingPlanTranslations).values(cleanUpdate({
      id: trId,
      planId,
      locale: t.locale,
      title: t.title,
      subtitle: t.subtitle || null,
      description: t.description || null,
      badge: t.badge,
      featuresJson: t.features.length > 0 ? JSON.stringify(t.features) : null,
    }))
  }
}

export async function deletePricingPlan(id: string) {
  const { id: userId } = await requireDelete()
  const db = await getActionDb()
  const existing = await db.select({ id: pricingPlans.id }).from(pricingPlans).where(eq(pricingPlans.id, id)).get()
  if (!existing) throw new Error('План не знайдено')
  // Safety net: seo_meta has no FK — remove any linked rows in the same transaction (P0-2).
  await db.transaction(async (tx) => {
    await tx.delete(seoMeta).where(eq(seoMeta.entityId, id))
    await tx.delete(pricingPlans).where(eq(pricingPlans.id, id)) // translations — ON DELETE CASCADE
  })
  await writeAuditLog({ userId, action: 'DELETE', entityType: 'PRICING_PLAN', entityId: id })
  revalidatePricing()
}

/* ── Backward-compatible aliases ── */
export const createPricing = createPricingPlan
export const updatePricing = updatePricingPlan
export const deletePricing = deletePricingPlan
