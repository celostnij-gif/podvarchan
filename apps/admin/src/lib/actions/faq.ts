'use server'
import { cleanUpdate } from './clean-update'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { eq, and } from 'drizzle-orm'
import { faqItems, faqItemTranslations, seoMeta } from '@podvarchan/shared'
import { getCurrentUser } from '@/lib/auth/session'
import { canEditContent } from '@/lib/auth/permissions'
import { requireDelete } from '@/lib/auth/guards'
import { getActionDb } from './db'
import { writeAuditLog } from '@/lib/audit/log'
import { revalidatePublic, revalidateAdmin, getFaqRevalidatePaths, cacheKeyPrefixes } from '@/lib/revalidate'

async function requireEdit(): Promise<string> {
  const user = await getCurrentUser()
  if (!user || !canEditContent(user.role)) throw new Error('Заборонено')
  return user.id
}

async function now(): Promise<string> { return new Date().toISOString() }

const faqSchema = z.object({
  group: z.enum(['HOME', 'GENERAL', 'SERVICE', 'CONTACTS']).optional().default('GENERAL'),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional().default('DRAFT'),
  serviceId: z.string().nullable().optional().default(null),
  translations: z.array(z.object({
    locale: z.enum(['ru', 'uk']),
    question: z.string().min(1).max(1000).optional().default(''),
    answer: z.string().min(1).max(10000).optional().default(''),
  })).min(1).max(2),
})

export async function createFaqItem(formData: FormData) {
  const userId = await requireEdit()
  const db = await getActionDb()
  const translations = [
    { locale: 'ru', question: formData.get('ru_question'), answer: formData.get('ru_answer') },
    { locale: 'uk', question: formData.get('uk_question'), answer: formData.get('uk_answer') },
  ].filter(t => t.question)
  const parsed = faqSchema.safeParse({
    group: formData.get('group'), sortOrder: formData.get('sortOrder'),
    status: formData.get('status'), translations,
    serviceId: formData.get('serviceId'),
  })
  if (!parsed.success) throw new Error(`Помилка валідації: ${parsed.error.message}`)
  const data = parsed.data
  const id = crypto.randomUUID()
  await db.insert(faqItems).values(cleanUpdate({
    id, group: data.group, sortOrder: data.sortOrder,
    status: data.status, serviceId: data.serviceId,
  }))
  for (const t of data.translations) {
    await db.insert(faqItemTranslations).values(cleanUpdate({
      id: crypto.randomUUID(), faqItemId: id, locale: t.locale,
      question: t.question, answer: t.answer,
    }))
  }
  await writeAuditLog({ userId, action: 'CREATE', entityType: 'FAQ', entityId: id, after: data })
  revalidateAdmin('/admin/faq')
  await revalidatePublic({ paths: getFaqRevalidatePaths(), prefixes: [cacheKeyPrefixes.faq] })
}

export async function updateFaqItem(id: string, formData: FormData) {
  const userId = await requireEdit()
  const db = await getActionDb()
  const existing = await db.select().from(faqItems).where(eq(faqItems.id, id)).get()
  if (!existing) throw new Error('FAQ не знайдено')
  const translations = [
    { locale: 'ru', question: formData.get('ru_question'), answer: formData.get('ru_answer') },
    { locale: 'uk', question: formData.get('uk_question'), answer: formData.get('uk_answer') },
  ].filter(t => t.question)
  const parsed = faqSchema.safeParse({
    group: formData.get('group'), sortOrder: formData.get('sortOrder'),
    status: formData.get('status'), translations,
    serviceId: formData.get('serviceId'),
  })
  if (!parsed.success) throw new Error(`Помилка валідації: ${parsed.error.message}`)
  const data = parsed.data
  await db.update(faqItems).set(cleanUpdate({
    group: data.group, sortOrder: data.sortOrder,
    status: data.status, serviceId: data.serviceId,
  })).where(eq(faqItems.id, id))
  for (const t of data.translations) {
    const existingTr = await db.select().from(faqItemTranslations)
      .where(and(eq(faqItemTranslations.faqItemId, id), eq(faqItemTranslations.locale, t.locale))).get()
    if (existingTr) {
      await db.update(faqItemTranslations).set(cleanUpdate({
        question: t.question, answer: t.answer,
      })).where(and(eq(faqItemTranslations.faqItemId, id), eq(faqItemTranslations.locale, t.locale)))
    } else {
      await db.insert(faqItemTranslations).values(cleanUpdate({
        id: crypto.randomUUID(), faqItemId: id, locale: t.locale,
        question: t.question, answer: t.answer,
      }))
    }
  }
  await writeAuditLog({ userId, action: 'UPDATE', entityType: 'FAQ', entityId: id, before: existing, after: data })
  revalidateAdmin('/admin/faq')
  await revalidatePublic({ paths: getFaqRevalidatePaths(), prefixes: [cacheKeyPrefixes.faq] })
}

export async function deleteFaqItem(id: string) {
  const { id: userId } = await requireDelete()
  const db = await getActionDb()
  const existing = await db.select().from(faqItems).where(eq(faqItems.id, id)).get()
  if (!existing) throw new Error('FAQ не знайдено')
  // Safety net: seo_meta has no FK — remove any linked rows in the same transaction (P0-2).
  await db.transaction(async (tx) => {
    await tx.delete(seoMeta).where(eq(seoMeta.entityId, id))
    await tx.delete(faqItems).where(eq(faqItems.id, id))
  })
  await writeAuditLog({ userId, action: 'DELETE', entityType: 'FAQ', entityId: id, before: existing })
  revalidateAdmin('/admin/faq')
  await revalidatePublic({ paths: getFaqRevalidatePaths(), prefixes: [cacheKeyPrefixes.faq] })
}

/* ── Reorder (drag-and-drop) ── */
export async function reorderFaqItems(orderedIds: string[]) {
  await requireEdit()
  const db = await getActionDb()
  for (let i = 0; i < orderedIds.length; i++) {
    await db.update(faqItems).set({ sortOrder: i }).where(eq(faqItems.id, orderedIds[i]))
  }
  revalidateAdmin('/admin/faq')
  await revalidatePublic({ paths: getFaqRevalidatePaths(), prefixes: [cacheKeyPrefixes.faq] })
}

/* ── Backward-compatible aliases (old form imports use these names) ── */
export const createFaq = createFaqItem
export const updateFaq = updateFaqItem
export const deleteFaq = deleteFaqItem
