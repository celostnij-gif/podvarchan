'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getDB } from '@/db'
import { testimonials, testimonialTranslations } from '@/db/schema/testimonials'
import { auditLogs } from '@/db/schema/auth'
import { getCurrentUser } from '@/lib/auth/session'
import { canEditContent, canDelete } from '@/lib/auth/permissions'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'

const testimonialTranslationSchema = z.object({
  locale: z.enum(['ru', 'uk']),
  problem: z.string().max(500).optional().default(''),
  result: z.string().max(500).optional().default(''),
  text: z.string().min(1).max(5000),
})

const testimonialSchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'HIDDEN']).optional().default('DRAFT'),
  clientName: z.string().min(1).max(200),
  clientAge: z.coerce.number().int().min(0).optional().default(0),
  avatarInitials: z.string().max(10).optional().default(''),
  rating: z.coerce.number().int().min(0).max(5).optional().default(0),
  source: z.string().max(200).optional().default(''),
  consentConfirmed: z.coerce.boolean().optional().default(false),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
  translations: z.array(testimonialTranslationSchema).min(1).max(2),
})

export async function createTestimonial(formData: FormData) {
  const user = await getCurrentUser()
  if (!user || !canEditContent(user.role)) throw new Error('Forbidden')
  const db = getDB()

  const raw: Record<string, unknown> = {
    status: formData.get('status'), clientName: formData.get('clientName'),
    clientAge: formData.get('clientAge'), avatarInitials: formData.get('avatarInitials'),
    rating: formData.get('rating'), source: formData.get('source'),
    consentConfirmed: formData.get('consentConfirmed') === 'on',
    sortOrder: formData.get('sortOrder'),
  }
  const locales = ['ru', 'uk']
  const translations: unknown[] = []
  for (const locale of locales) {
    const text = formData.get(`${locale}_text`)
    if (!text) continue
    translations.push({
      locale, text,
      problem: formData.get(`${locale}_problem`) ?? '',
      result: formData.get(`${locale}_result`) ?? '',
    })
  }
  raw.translations = translations

  const parsed = testimonialSchema.safeParse(raw)
  if (!parsed.success) throw new Error(`Validation error: ${parsed.error.message}`)

  const id = randomUUID()
  await db.insert(testimonials).values({
    id, status: parsed.data.status, clientName: parsed.data.clientName,
    clientAge: parsed.data.clientAge || null, avatarInitials: parsed.data.avatarInitials || null,
    rating: parsed.data.rating || null, source: parsed.data.source || null,
    consentConfirmed: parsed.data.consentConfirmed, sortOrder: parsed.data.sortOrder,
    publishedAt: parsed.data.status === 'PUBLISHED' ? new Date().toISOString() : null,
  })
  for (const t of parsed.data.translations) {
    await db.insert(testimonialTranslations).values({
      id: randomUUID(), testimonialId: id, locale: t.locale,
      problem: t.problem || null, result: t.result || null, text: t.text,
    })
  }
  await db.insert(auditLogs).values({
    id: randomUUID(), userId: user.id, action: 'CREATE', entityType: 'testimonial', entityId: id,
    afterJson: JSON.stringify(parsed.data), createdAt: new Date().toISOString(),
  })
  revalidatePath('/admin/testimonials')
  redirect('/admin/testimonials')
}

export async function updateTestimonial(id: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user || !canEditContent(user.role)) throw new Error('Forbidden')
  const db = getDB()
  const existing = await db.select().from(testimonials).where(eq(testimonials.id, id)).get()
  if (!existing) throw new Error('Testimonial not found')

  const raw: Record<string, unknown> = {
    status: formData.get('status'), clientName: formData.get('clientName'),
    clientAge: formData.get('clientAge'), avatarInitials: formData.get('avatarInitials'),
    rating: formData.get('rating'), source: formData.get('source'),
    consentConfirmed: formData.get('consentConfirmed') === 'on',
    sortOrder: formData.get('sortOrder'),
  }
  const locales = ['ru', 'uk']
  const translations: unknown[] = []
  for (const locale of locales) {
    const text = formData.get(`${locale}_text`)
    if (!text) continue
    translations.push({
      locale, text,
      problem: formData.get(`${locale}_problem`) ?? '',
      result: formData.get(`${locale}_result`) ?? '',
    })
  }
  raw.translations = translations

  const parsed = testimonialSchema.safeParse(raw)
  if (!parsed.success) throw new Error(`Validation error: ${parsed.error.message}`)

  await db.update(testimonials).set({
    status: parsed.data.status, clientName: parsed.data.clientName,
    clientAge: parsed.data.clientAge || null, avatarInitials: parsed.data.avatarInitials || null,
    rating: parsed.data.rating || null, source: parsed.data.source || null,
    consentConfirmed: parsed.data.consentConfirmed, sortOrder: parsed.data.sortOrder,
    publishedAt: parsed.data.status === 'PUBLISHED' && !existing.publishedAt ? new Date().toISOString() : existing.publishedAt,
  }).where(eq(testimonials.id, id))

  for (const t of parsed.data.translations) {
    const existingTr = await db.select().from(testimonialTranslations)
      .where(and(eq(testimonialTranslations.testimonialId, id), eq(testimonialTranslations.locale, t.locale))).get()
    if (existingTr) {
      await db.update(testimonialTranslations).set({ problem: t.problem || null, result: t.result || null, text: t.text })
        .where(and(eq(testimonialTranslations.testimonialId, id), eq(testimonialTranslations.locale, t.locale)))
    } else {
      await db.insert(testimonialTranslations).values({
        id: randomUUID(), testimonialId: id, locale: t.locale, problem: t.problem || null, result: t.result || null, text: t.text,
      })
    }
  }

  await db.insert(auditLogs).values({
    id: randomUUID(), userId: user.id, action: 'UPDATE', entityType: 'testimonial', entityId: id,
    beforeJson: JSON.stringify(existing), afterJson: JSON.stringify(parsed.data),
    createdAt: new Date().toISOString(),
  })
  revalidatePath('/admin/testimonials')
  redirect('/admin/testimonials')
}

export async function deleteTestimonial(id: string) {
  const user = await getCurrentUser()
  if (!user || !canDelete(user.role)) throw new Error('Forbidden')
  const db = getDB()
  await db.delete(testimonials).where(eq(testimonials.id, id))
  await db.insert(auditLogs).values({
    id: randomUUID(), userId: user.id, action: 'DELETE', entityType: 'testimonial', entityId: id,
    createdAt: new Date().toISOString(),
  })
  revalidatePath('/admin/testimonials')
}
