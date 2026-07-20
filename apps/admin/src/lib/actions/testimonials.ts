'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq, and } from 'drizzle-orm'
import { testimonials, testimonialTranslations, redirectRules, seoMeta } from '@podvarchan/shared'
import { getCurrentUser } from '@/lib/auth/session'
import { canEditContent, canDelete, canPublish } from '@/lib/auth/permissions'
import { getActionDb } from './db'
import { writeAuditLog } from '@/lib/audit/log'
import { revalidatePublic, revalidateAdmin, getHomeRevalidatePaths } from '@/lib/revalidate'

async function requireEdit(): Promise<string> {
  const user = await getCurrentUser()
  if (!user || !canEditContent(user.role)) throw new Error('Заборонено')
  return user.id
}

const testimonialSchema = z.object({
  clientName: z.string().min(1).max(200).optional().default(''),
  clientAge: z.coerce.number().int().min(0).optional().nullable().default(null),
  rating: z.coerce.number().int().min(1).max(5).optional().default(5),
  source: z.string().max(200).optional().default(''),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
  status: z.enum(['DRAFT', 'PUBLISHED', 'HIDDEN']).optional().default('DRAFT'),
  translations: z.array(z.object({
    locale: z.enum(['ru', 'uk']),
    text: z.string().optional().default(''),
    problem: z.string().optional().default(''),
    result: z.string().optional().default(''),
  })).min(1).max(2),
})

export async function createTestimonial(formData: FormData) {
  const userId = await requireEdit()
  const db = await getActionDb()
  const translations = [
    { locale: 'ru' as const, text: formData.get('ru_text'), problem: formData.get('ru_problem'), result: formData.get('ru_result') },
    { locale: 'uk' as const, text: formData.get('uk_text'), problem: formData.get('uk_problem'), result: formData.get('uk_result') },
  ].filter(t => t.text || t.problem || t.result)
  const parsed = testimonialSchema.safeParse({
    clientName: formData.get('clientName'), clientAge: formData.get('clientAge'),
    rating: formData.get('rating'), source: formData.get('source'),
    sortOrder: formData.get('sortOrder'), status: formData.get('status'), translations,
  })
  if (!parsed.success) throw new Error(`Помилка валідації: ${parsed.error.message}`)
  const data = parsed.data
  const id = crypto.randomUUID()
  const ts = new Date().toISOString()
  await db.insert(testimonials).values({
    id, clientName: data.clientName || null, clientAge: data.clientAge,
    rating: data.rating, source: data.source || null,
    sortOrder: data.sortOrder, status: data.status, consentConfirmed: false,
    createdAt: ts,
  })
  for (const t of data.translations) {
    await db.insert(testimonialTranslations).values({
      id: crypto.randomUUID(), testimonialId: id, locale: t.locale,
      text: t.text || null, problem: t.problem || null, result: t.result || null,
    })
  }
  await writeAuditLog({ userId, action: 'CREATE', entityType: 'TESTIMONIAL', entityId: id, after: data })
  revalidateAdmin('/admin/testimonials')
  void revalidatePublic({ paths: getHomeRevalidatePaths() })
  redirect('/admin/testimonials')
}

export async function updateTestimonial(id: string, formData: FormData) {
  const userId = await requireEdit()
  const db = await getActionDb()
  const existing = await db.select().from(testimonials).where(eq(testimonials.id, id)).get()
  if (!existing) throw new Error('Відгук не знайдено')
  const translations = [
    { locale: 'ru' as const, text: formData.get('ru_text'), problem: formData.get('ru_problem'), result: formData.get('ru_result') },
    { locale: 'uk' as const, text: formData.get('uk_text'), problem: formData.get('uk_problem'), result: formData.get('uk_result') },
  ].filter(t => t.text || t.problem || t.result)
  const parsed = testimonialSchema.safeParse({
    clientName: formData.get('clientName'), clientAge: formData.get('clientAge'),
    rating: formData.get('rating'), source: formData.get('source'),
    sortOrder: formData.get('sortOrder'), status: formData.get('status'), translations,
  })
  if (!parsed.success) throw new Error(`Помилка валідації: ${parsed.error.message}`)
  const data = parsed.data
  await db.update(testimonials).set({
    clientName: data.clientName || null, clientAge: data.clientAge,
    rating: data.rating, source: data.source || null,
    sortOrder: data.sortOrder, status: data.status,
  }).where(eq(testimonials.id, id))
  for (const t of data.translations) {
    const existingTr = await db.select().from(testimonialTranslations)
      .where(and(eq(testimonialTranslations.testimonialId, id), eq(testimonialTranslations.locale, t.locale))).get()
    if (existingTr) {
      await db.update(testimonialTranslations).set({ text: t.text || null, problem: t.problem || null, result: t.result || null }).where(eq(testimonialTranslations.id, existingTr.id))
    } else {
      await db.insert(testimonialTranslations).values({
        id: crypto.randomUUID(), testimonialId: id, locale: t.locale,
        text: t.text || null, problem: t.problem || null, result: t.result || null,
      })
    }
  }
  await writeAuditLog({ userId, action: 'UPDATE', entityType: 'TESTIMONIAL', entityId: id, before: existing, after: data })
  revalidateAdmin('/admin/testimonials')
  void revalidatePublic({ paths: getHomeRevalidatePaths() })
  redirect('/admin/testimonials')
}

export async function deleteTestimonial(id: string) {
  const userId = await requireEdit()
  const db = await getActionDb()
  const existing = await db.select().from(testimonials).where(eq(testimonials.id, id)).get()
  if (!existing) throw new Error('Відгук не знайдено')
  await db.delete(testimonials).where(eq(testimonials.id, id))
  await writeAuditLog({ userId, action: 'DELETE', entityType: 'TESTIMONIAL', entityId: id, before: existing })
  revalidateAdmin('/admin/testimonials')
  void revalidatePublic({ paths: getHomeRevalidatePaths() })
  redirect('/admin/testimonials')
}

export async function publishTestimonial(id: string) {
  const userId = await requireEdit()
  const db = await getActionDb()
  const existing = await db.select().from(testimonials).where(eq(testimonials.id, id)).get()
  if (!existing) throw new Error('Відгук не знайдено')
  const newStatus = existing.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'

  // YMYL: only OWNER/ADMIN can publish, requires consent
  if (newStatus === 'PUBLISHED') {
    const user = await getCurrentUser()
    if (!user || !canPublish(user.role)) throw new Error('Лише ВЛАСНИК або АДМІН можуть публікувати відгуки')

    if (!existing.consentConfirmed) throw new Error('Неможливо опублікувати відгук без підтвердженої згоди')

    const translations = await db
      .select()
      .from(testimonialTranslations)
      .where(eq(testimonialTranslations.testimonialId, id))
      .all()

    const ruTr = translations.find(t => t.locale === 'ru')
    const ukTr = translations.find(t => t.locale === 'uk')

    if (!ruTr?.text) throw new Error('RU текст відгуку обов\'язковий для публікації')
    if (!ukTr?.text) throw new Error('UK текст відгуку обов\'язковий для публікації')
  }

  await db.update(testimonials).set({ status: newStatus }).where(eq(testimonials.id, id))
  await writeAuditLog({
    userId, action: newStatus === 'PUBLISHED' ? 'PUBLISH' : 'UNPUBLISH',
    entityType: 'TESTIMONIAL', entityId: id, after: { status: newStatus },
  })
  revalidateAdmin('/admin/testimonials')
  void revalidatePublic({ paths: getHomeRevalidatePaths() })
}

/* ── Reorder (drag-and-drop) ── */
export async function reorderTestimonials(orderedIds: string[]) {
  await requireEdit()
  const db = await getActionDb()
  for (let i = 0; i < orderedIds.length; i++) {
    await db.update(testimonials).set({ sortOrder: i }).where(eq(testimonials.id, orderedIds[i]))
  }
  revalidateAdmin('/admin/testimonials')
  void revalidatePublic({ paths: getHomeRevalidatePaths() })
}
