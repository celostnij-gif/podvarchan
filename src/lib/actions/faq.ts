'use server'

/**
 * Server Actions для модуля «FAQ».
 */

import { eq, and, asc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getActionDb } from './db'
import { ok, okVoid, fail } from './result'
import { withRole, withCanDelete } from './guard'
import * as s from '@/db/schema'
import { writeAuditLog } from '@/lib/audit/log'

const FaqSchema = z.object({
  group: z.enum(['HOME', 'GENERAL', 'SERVICE', 'CONTACTS']).default('GENERAL'),
  serviceId: z.string().optional(),
  sortOrder: z.number().int().default(0),
  translations: z.array(z.object({
    locale: z.enum(['ru', 'uk']),
    question: z.string().min(1, 'Питання обов\'язкове'),
    answer: z.string().min(1, 'Відповідь обов\'язкова'),
  })).min(1),
})

export async function getFaqItems() {
  try {
    const db = getActionDb()
    const rows = await db
      .select({
        id: s.faqItems.id,
        group: s.faqItems.group,
        serviceId: s.faqItems.serviceId,
        status: s.faqItems.status,
        sortOrder: s.faqItems.sortOrder,
        questionRu: s.faqItemTranslations.question,
      })
      .from(s.faqItems)
      .leftJoin(
        s.faqItemTranslations,
        and(
          eq(s.faqItemTranslations.faqItemId, s.faqItems.id),
          eq(s.faqItemTranslations.locale, 'ru'),
        ),
      )
      .orderBy(asc(s.faqItems.sortOrder))
    return ok(rows)
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося завантажити FAQ')
  }
}

export async function getFaqItem(id: string) {
  try {
    const db = getActionDb()
    const [item] = await db.select().from(s.faqItems).where(eq(s.faqItems.id, id)).limit(1)
    if (!item) return fail('Запитання не знайдено')
    const translations = await db.select().from(s.faqItemTranslations).where(eq(s.faqItemTranslations.faqItemId, id))
    return ok({ ...item, translations })
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося завантажити запитання')
  }
}

export const createFaqItem = withRole('EDITOR', async (session, ...args) => {
  try {
    const db = getActionDb()
    const id = crypto.randomUUID()
    const input = FaqSchema.parse(args[0] ?? {})
    await db.insert(s.faqItems).values({ id, group: input.group, serviceId: input.serviceId ?? null, status: 'PUBLISHED', sortOrder: input.sortOrder })
    for (const t of input.translations) {
      await db.insert(s.faqItemTranslations).values({ id: crypto.randomUUID(), faqItemId: id, locale: t.locale, question: t.question, answer: t.answer })
    }
    await writeAuditLog({ userId: session.user.id, action: 'CREATE', entityType: 'FAQ', entityId: id })
    revalidatePath('/admin/faq')
    const [created] = await db.select().from(s.faqItems).where(eq(s.faqItems.id, id)).limit(1)
    return ok(created, 'Запитання додано')
  } catch (e) {
    if (e instanceof z.ZodError) {
      const fieldErrors: Record<string, string[]> = {}
      for (const issue of e.issues) { const p = issue.path.join('.'); if (!fieldErrors[p]) fieldErrors[p] = []; fieldErrors[p].push(issue.message) }
      return fail('Помилка валідації', fieldErrors)
    }
    return fail(e instanceof Error ? e.message : 'Не вдалося створити запитання')
  }
})

export const updateFaqItem = withRole('EDITOR', async (session, ...args) => {
  try {
    const db = getActionDb()
    const id = args[0] as string
    const data = args[1] ?? {}
    const [existing] = await db.select().from(s.faqItems).where(eq(s.faqItems.id, id)).limit(1)
    if (!existing) return fail('Запитання не знайдено')

    const input = FaqSchema.partial().parse(data)
    const updateData: Record<string, unknown> = {}
    if (input.group !== undefined) updateData.group = input.group
    if (input.serviceId !== undefined) updateData.serviceId = input.serviceId
    if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder
    await db.update(s.faqItems).set(updateData).where(eq(s.faqItems.id, id))

    if (input.translations) {
      for (const t of input.translations) {
        const [existingT] = await db.select().from(s.faqItemTranslations).where(and(eq(s.faqItemTranslations.faqItemId, id), eq(s.faqItemTranslations.locale, t.locale))).limit(1)
        if (existingT) {
          await db.update(s.faqItemTranslations).set(t).where(eq(s.faqItemTranslations.id, existingT.id))
        } else {
          await db.insert(s.faqItemTranslations).values({ id: crypto.randomUUID(), faqItemId: id, locale: t.locale, question: t.question, answer: t.answer })
        }
      }
    }

    await writeAuditLog({ userId: session.user.id, action: 'UPDATE', entityType: 'FAQ', entityId: id })
    revalidatePath('/admin/faq')
    return okVoid('Запитання оновлено')
  } catch (e) {
    if (e instanceof z.ZodError) {
      const fieldErrors: Record<string, string[]> = {}
      for (const issue of e.issues) { const p = issue.path.join('.'); if (!fieldErrors[p]) fieldErrors[p] = []; fieldErrors[p].push(issue.message) }
      return fail('Помилка валідації', fieldErrors)
    }
    return fail(e instanceof Error ? e.message : 'Не вдалося оновити запитання')
  }
})

export const deleteFaqItem = withCanDelete(async (session, ...args) => {
  try {
    const db = getActionDb()
    const id = args[0] as string
    const [existing] = await db.select().from(s.faqItems).where(eq(s.faqItems.id, id)).limit(1)
    if (!existing) return fail('Запитання не знайдено')
    await db.delete(s.faqItems).where(eq(s.faqItems.id, id))
    await writeAuditLog({ userId: session.user.id, action: 'DELETE', entityType: 'FAQ', entityId: id })
    revalidatePath('/admin/faq')
    return okVoid('Запитання видалено')
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося видалити запитання')
  }
})
