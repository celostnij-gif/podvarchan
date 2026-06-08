'use server'

/**
 * Server Actions для модуля «Услуги».
 */

import { eq, and, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getActionDb } from './db'
import { ok, okVoid, fail, type ActionResult } from './result'
import { withRole, withCanDelete } from './guard'
import * as s from '@/db/schema'
import { writeAuditLog } from '@/lib/audit/log'
import type { Service, ServiceTranslation } from '@/db/schema'

/* ── Схеми валідації ── */

const TranslationSchema = z.object({
  locale: z.enum(['ru', 'uk']),
  title: z.string().min(1, 'Назва обов\'язкова'),
  shortTitle: z.string().optional(),
  description: z.string().optional(),
  slug: z.string().min(1),
  heroTitle: z.string().optional(),
  heroSubtitle: z.string().optional(),
  symptomsJson: z.string().optional(),
  processJson: z.string().optional(),
  benefitsJson: z.string().optional(),
  faqJson: z.string().optional(),
  ctaText: z.string().optional(),
})

const ServiceCreateSchema = z.object({
  slugBase: z.string().min(1, 'Slug обов\'язковий').regex(/^[a-z0-9-]+$/, 'Тільки латиниця, цифри та дефіси'),
  icon: z.string().optional(),
  category: z.string().optional(),
  priority: z.number().int().min(1).max(10).default(3),
  featured: z.boolean().default(false),
  translations: z.array(TranslationSchema).min(1, 'Потрібен хоча б один переклад'),
})

const ServiceUpdateSchema = ServiceCreateSchema.partial()

/* ── Read ── */

export async function getServices(): Promise<ActionResult<Service[]>> {
  try {
    const db = getActionDb()
    const items = await db.select().from(s.services).orderBy(desc(s.services.createdAt))
    return ok(items)
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося завантажити послуги')
  }
}

export async function getService(id: string): Promise<ActionResult<Service & { translations: ServiceTranslation[] }>> {
  try {
    const db = getActionDb()
    const [item] = await db.select().from(s.services).where(eq(s.services.id, id)).limit(1)
    if (!item) return fail('Послугу не знайдено')

    const translations = await db.select()
      .from(s.serviceTranslations)
      .where(eq(s.serviceTranslations.serviceId, id))

    return ok({ ...item, translations })
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося завантажити послугу')
  }
}

/* ── Create ── */

export const createService = withRole('EDITOR', async (session, ...args) => {
  try {
    const db = getActionDb()
    const id = crypto.randomUUID()
    const data = args[0] ?? {}
    const input = ServiceCreateSchema.parse(data)

    await db.insert(s.services).values({
      id,
      slugBase: input.slugBase,
      icon: input.icon ?? null,
      category: input.category ?? null,
      priority: input.priority,
      featured: input.featured,
      status: 'DRAFT',
      sortOrder: 0,
    })

    for (const t of input.translations) {
      await db.insert(s.serviceTranslations).values({
        id: crypto.randomUUID(),
        serviceId: id,
        locale: t.locale,
        slug: t.slug,
        title: t.title,
        shortTitle: t.shortTitle ?? null,
        description: t.description ?? null,
        heroTitle: t.heroTitle ?? null,
        heroSubtitle: t.heroSubtitle ?? null,
        symptomsJson: t.symptomsJson ?? null,
        processJson: t.processJson ?? null,
        benefitsJson: t.benefitsJson ?? null,
        faqJson: t.faqJson ?? null,
        ctaText: t.ctaText ?? null,
      })
    }

    await writeAuditLog({ userId: session.user.id, action: 'CREATE', entityType: 'SERVICE', entityId: id })

    const [created] = await db.select().from(s.services).where(eq(s.services.id, id)).limit(1)
    revalidatePath('/admin/services')
    return ok(created, 'Послугу створено')
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
    return fail(e instanceof Error ? e.message : 'Не вдалося створити послугу')
  }
})

/* ── Update ── */

export const updateService = withRole('EDITOR', async (session, ...args) => {
  try {
    const db = getActionDb()
    const id = args[0] as string
    const data = args[1] ?? {}

    const [existing] = await db.select().from(s.services).where(eq(s.services.id, id)).limit(1)
    if (!existing) return fail('Послугу не знайдено')

    const input = ServiceUpdateSchema.parse(data)

    // ── Оновлення базових полів послуги (без перекладів) ──
    const { translations, ...serviceFields } = input
    const hasServiceFields = Object.keys(serviceFields).length > 0

    if (hasServiceFields) {
      await db.update(s.services).set(serviceFields).where(eq(s.services.id, id))
    }

    // ── Оновлення перекладів ──
    if (translations && translations.length > 0) {
      for (const t of translations) {
        const [existingTranslation] = await db
          .select()
          .from(s.serviceTranslations)
          .where(
            and(
              eq(s.serviceTranslations.serviceId, id),
              eq(s.serviceTranslations.locale, t.locale),
            ),
          )
          .limit(1)

        if (existingTranslation) {
          await db
            .update(s.serviceTranslations)
            .set({
              title: t.title,
              slug: t.slug,
              shortTitle: t.shortTitle ?? null,
              description: t.description ?? null,
              heroTitle: t.heroTitle ?? null,
              heroSubtitle: t.heroSubtitle ?? null,
              symptomsJson: t.symptomsJson ?? null,
              processJson: t.processJson ?? null,
              benefitsJson: t.benefitsJson ?? null,
              faqJson: t.faqJson ?? null,
              ctaText: t.ctaText ?? null,
            })
            .where(eq(s.serviceTranslations.id, existingTranslation.id))
        } else {
          await db.insert(s.serviceTranslations).values({
            id: crypto.randomUUID(),
            serviceId: id,
            locale: t.locale,
            slug: t.slug,
            title: t.title,
            shortTitle: t.shortTitle ?? null,
            description: t.description ?? null,
            heroTitle: t.heroTitle ?? null,
            heroSubtitle: t.heroSubtitle ?? null,
            symptomsJson: t.symptomsJson ?? null,
            processJson: t.processJson ?? null,
            benefitsJson: t.benefitsJson ?? null,
            faqJson: t.faqJson ?? null,
            ctaText: t.ctaText ?? null,
          })
        }
      }
    }

    await writeAuditLog({
      userId: session.user.id,
      action: 'UPDATE',
      entityType: 'SERVICE',
      entityId: id,
      before: { status: existing.status },
      after: { ...input },
    })

    const [updated] = await db.select().from(s.services).where(eq(s.services.id, id)).limit(1)
    revalidatePath('/admin/services')
    revalidatePath('/admin/services/' + id)
    return ok(updated, 'Послугу оновлено')
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
    return fail(e instanceof Error ? e.message : 'Не вдалося оновити послугу')
  }
})

/* ── Delete ── */

export const deleteService = withCanDelete(async (session, ...args) => {
  try {
    const db = getActionDb()
    const id = args[0] as string
    const [existing] = await db.select().from(s.services).where(eq(s.services.id, id)).limit(1)
    if (!existing) return fail('Послугу не знайдено')

    await db.delete(s.services).where(eq(s.services.id, id))
    await writeAuditLog({ userId: session.user.id, action: 'DELETE', entityType: 'SERVICE', entityId: id })

    revalidatePath('/admin/services')
    return okVoid('Послугу видалено')
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося видалити послугу')
  }
})

/* ── Publish / Unpublish ── */

export const publishService = withRole('EDITOR', async (session, ...args) => {
  try {
    const db = getActionDb()
    const id = args[0] as string
    const [existing] = await db.select().from(s.services).where(eq(s.services.id, id)).limit(1)
    if (!existing) return fail('Послугу не знайдено')

    const newStatus = existing.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
    await db.update(s.services).set({
      status: newStatus,
      publishedAt: newStatus === 'PUBLISHED' ? new Date() : null,
    }).where(eq(s.services.id, id))

    await writeAuditLog({
      userId: session.user.id,
      action: newStatus === 'PUBLISHED' ? 'PUBLISH' : 'UNPUBLISH',
      entityType: 'SERVICE',
      entityId: id,
    })

    revalidatePath('/admin/services')
    return okVoid(newStatus === 'PUBLISHED' ? 'Послугу опубліковано' : 'Послугу знято з публікації')
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося змінити статус')
  }
})
