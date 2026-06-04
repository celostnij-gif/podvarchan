'use server'

/**
 * Server Actions для модуля «Отзывы».
 */

import { eq, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getActionDb } from './db'
import { ok, okVoid, fail } from './result'
import { withRole, withCanDelete } from './guard'
import * as s from '@/db/schema'
import { writeAuditLog } from '@/lib/audit/log'

const TestimonialSchema = z.object({
  clientName: z.string().min(1, 'Ім\'я клієнта обов\'язкове'),
  clientAge: z.number().int().min(10).max(120).optional(),
  avatarInitials: z.string().max(4).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  source: z.string().optional(),
  consentConfirmed: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  translations: z.array(z.object({
    locale: z.enum(['ru', 'uk']),
    text: z.string().min(1, 'Текст відгуку обов\'язковий'),
    problem: z.string().optional(),
    result: z.string().optional(),
  })).min(1),
})

export async function getTestimonials() {
  try {
    const db = getActionDb()
    const items = await db.select().from(s.testimonials).orderBy(desc(s.testimonials.createdAt))
    return ok(items)
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося завантажити відгуки')
  }
}

export async function getTestimonial(id: string) {
  try {
    const db = getActionDb()
    const [item] = await db.select().from(s.testimonials).where(eq(s.testimonials.id, id)).limit(1)
    if (!item) return fail('Відгук не знайдено')
    const translations = await db.select().from(s.testimonialTranslations).where(eq(s.testimonialTranslations.testimonialId, id))
    return ok({ ...item, translations })
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося завантажити відгук')
  }
}

export const createTestimonial = withRole('EDITOR', async (session, ...args) => {
  try {
    const db = getActionDb()
    const data = args[0] ?? {}
    const id = crypto.randomUUID()
    const input = TestimonialSchema.parse(data)

    await db.insert(s.testimonials).values({
      id,
      clientName: input.clientName,
      clientAge: input.clientAge ?? null,
      avatarInitials: input.avatarInitials ?? null,
      rating: input.rating ?? null,
      source: input.source ?? null,
      consentConfirmed: input.consentConfirmed,
      status: 'DRAFT',
      sortOrder: input.sortOrder,
    })

    for (const t of input.translations) {
      await db.insert(s.testimonialTranslations).values({
        id: crypto.randomUUID(),
        testimonialId: id,
        locale: t.locale,
        text: t.text,
        problem: t.problem ?? null,
        result: t.result ?? null,
      })
    }

    await writeAuditLog({ userId: session.user.id, action: 'CREATE', entityType: 'TESTIMONIAL', entityId: id })
    revalidatePath('/admin/testimonials')

    const [created] = await db.select().from(s.testimonials).where(eq(s.testimonials.id, id)).limit(1)
    return ok(created, 'Відгук додано')
  } catch (e) {
    if (e instanceof z.ZodError) {
      const fieldErrors: Record<string, string[]> = {}
      for (const issue of e.issues) {
        const path = issue.path.join('.')
        if (!fieldErrors[path]) fieldErrors[path] = []
        fieldErrors[path].push(issue.message)
      }
      return fail('Помилка валідації', fieldErrors)
    }
    return fail(e instanceof Error ? e.message : 'Не вдалося створити відгук')
  }
})

export const updateTestimonial = withRole('EDITOR', async (session, ...args) => {
  try {
    const db = getActionDb()
    const id = args[0] as string
    const data = args[1] ?? {}
    const [existing] = await db.select().from(s.testimonials).where(eq(s.testimonials.id, id)).limit(1)
    if (!existing) return fail('Відгук не знайдено')

    const input = TestimonialSchema.partial().parse(data)
    await db.update(s.testimonials).set(input).where(eq(s.testimonials.id, id))
    await writeAuditLog({ userId: session.user.id, action: 'UPDATE', entityType: 'TESTIMONIAL', entityId: id })
    revalidatePath('/admin/testimonials')

    const [updated] = await db.select().from(s.testimonials).where(eq(s.testimonials.id, id)).limit(1)
    return ok(updated, 'Відгук оновлено')
  } catch (e) {
    if (e instanceof z.ZodError) {
      const fieldErrors: Record<string, string[]> = {}
      for (const issue of e.issues) {
        const path = issue.path.join('.')
        if (!fieldErrors[path]) fieldErrors[path] = []
        fieldErrors[path].push(issue.message)
      }
      return fail('Помилка валідації', fieldErrors)
    }
    return fail(e instanceof Error ? e.message : 'Не вдалося оновити відгук')
  }
})

export const deleteTestimonial = withCanDelete(async (session, ...args) => {
  try {
    const db = getActionDb()
    const id = args[0] as string
    const [existing] = await db.select().from(s.testimonials).where(eq(s.testimonials.id, id)).limit(1)
    if (!existing) return fail('Відгук не знайдено')

    await db.delete(s.testimonials).where(eq(s.testimonials.id, id))
    await writeAuditLog({ userId: session.user.id, action: 'DELETE', entityType: 'TESTIMONIAL', entityId: id })
    revalidatePath('/admin/testimonials')
    return okVoid('Відгук видалено')
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося видалити відгук')
  }
})

export const publishTestimonial = withRole('EDITOR', async (session, ...args) => {
  try {
    const db = getActionDb()
    const id = args[0] as string
    const [existing] = await db.select().from(s.testimonials).where(eq(s.testimonials.id, id)).limit(1)
    if (!existing) return fail('Відгук не знайдено')

    const statusMap: Record<string, string> = { DRAFT: 'PUBLISHED', PUBLISHED: 'HIDDEN', HIDDEN: 'PUBLISHED' }
    const newStatus = statusMap[existing.status] ?? 'PUBLISHED'

    await db.update(s.testimonials).set({
      status: newStatus as 'DRAFT' | 'PUBLISHED' | 'HIDDEN',
      publishedAt: newStatus === 'PUBLISHED' ? new Date() : existing.publishedAt,
    }).where(eq(s.testimonials.id, id))

    await writeAuditLog({ userId: session.user.id, action: newStatus === 'PUBLISHED' ? 'PUBLISH' : 'UPDATE', entityType: 'TESTIMONIAL', entityId: id })
    revalidatePath('/admin/testimonials')
    return okVoid(`Відгук переведено в статус «${newStatus}»`)
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося змінити статус')
  }
})
