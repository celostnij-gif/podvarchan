'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getDB } from '@/db'
import { faqItems, faqItemTranslations } from '@/db/schema/faq'
import { auditLogs } from '@/db/schema/auth'
import { getCurrentUser } from '@/lib/auth/session'
import { canEditContent, canDelete } from '@/lib/auth/permissions'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'

const faqTranslationSchema = z.object({
  locale: z.enum(['ru', 'uk']),
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(5000),
})

const faqSchema = z.object({
  group: z.enum(['HOME', 'GENERAL', 'SERVICE', 'CONTACTS']).optional().default('GENERAL'),
  serviceId: z.string().optional().default(''),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional().default('DRAFT'),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
  translations: z.array(faqTranslationSchema).min(1).max(2),
})

export async function createFaq(formData: FormData) {
  const user = await getCurrentUser()
  if (!user || !canEditContent(user.role)) throw new Error('Forbidden')
  const db = getDB()

  const raw: Record<string, unknown> = {
    group: formData.get('group'),
    serviceId: formData.get('serviceId'),
    status: formData.get('status'),
    sortOrder: formData.get('sortOrder'),
  }
  const locales = ['ru', 'uk']
  const translations: unknown[] = []
  for (const locale of locales) {
    const question = formData.get(`${locale}_question`)
    if (!question) continue
    translations.push({ locale, question, answer: formData.get(`${locale}_answer`) ?? '' })
  }
  raw.translations = translations

  const parsed = faqSchema.safeParse(raw)
  if (!parsed.success) throw new Error(`Validation error: ${parsed.error.message}`)

  const id = randomUUID()
  await db.insert(faqItems).values({
    id, group: parsed.data.group, serviceId: parsed.data.serviceId || null,
    status: parsed.data.status, sortOrder: parsed.data.sortOrder,
  })
  for (const t of parsed.data.translations) {
    await db.insert(faqItemTranslations).values({
      id: randomUUID(), faqItemId: id, locale: t.locale, question: t.question, answer: t.answer,
    })
  }
  await db.insert(auditLogs).values({
    id: randomUUID(), userId: user.id, action: 'CREATE', entityType: 'faq', entityId: id,
    afterJson: JSON.stringify(parsed.data), createdAt: new Date().toISOString(),
  })
  revalidatePath('/admin/faq')
  redirect('/admin/faq')
}

export async function updateFaq(id: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user || !canEditContent(user.role)) throw new Error('Forbidden')
  const db = getDB()

  const existing = await db.select().from(faqItems).where(eq(faqItems.id, id)).get()
  if (!existing) throw new Error('FAQ not found')

  const raw: Record<string, unknown> = {
    group: formData.get('group'), serviceId: formData.get('serviceId'),
    status: formData.get('status'), sortOrder: formData.get('sortOrder'),
  }
  const locales = ['ru', 'uk']
  const translations: unknown[] = []
  for (const locale of locales) {
    const question = formData.get(`${locale}_question`)
    if (!question) continue
    translations.push({ locale, question, answer: formData.get(`${locale}_answer`) ?? '' })
  }
  raw.translations = translations

  const parsed = faqSchema.safeParse(raw)
  if (!parsed.success) throw new Error(`Validation error: ${parsed.error.message}`)

  await db.update(faqItems).set({
    group: parsed.data.group, serviceId: parsed.data.serviceId || null,
    status: parsed.data.status, sortOrder: parsed.data.sortOrder,
  }).where(eq(faqItems.id, id))

  for (const t of parsed.data.translations) {
    const existingTr = await db.select().from(faqItemTranslations)
      .where(and(eq(faqItemTranslations.faqItemId, id), eq(faqItemTranslations.locale, t.locale))).get()
    if (existingTr) {
      await db.update(faqItemTranslations).set({ question: t.question, answer: t.answer })
        .where(and(eq(faqItemTranslations.faqItemId, id), eq(faqItemTranslations.locale, t.locale)))
    } else {
      await db.insert(faqItemTranslations).values({
        id: randomUUID(), faqItemId: id, locale: t.locale, question: t.question, answer: t.answer,
      })
    }
  }

  await db.insert(auditLogs).values({
    id: randomUUID(), userId: user.id, action: 'UPDATE', entityType: 'faq', entityId: id,
    beforeJson: JSON.stringify(existing), afterJson: JSON.stringify(parsed.data),
    createdAt: new Date().toISOString(),
  })
  revalidatePath('/admin/faq')
  redirect('/admin/faq')
}

export async function deleteFaq(id: string) {
  const user = await getCurrentUser()
  if (!user || !canDelete(user.role)) throw new Error('Forbidden')
  const db = getDB()
  await db.delete(faqItems).where(eq(faqItems.id, id))
  await db.insert(auditLogs).values({
    id: randomUUID(), userId: user.id, action: 'DELETE', entityType: 'faq', entityId: id,
    createdAt: new Date().toISOString(),
  })
  revalidatePath('/admin/faq')
}
