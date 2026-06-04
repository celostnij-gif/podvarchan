'use server'

/**
 * Server Actions для модуля «SEO» — управління seo_meta.
 */

import { eq, asc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getActionDb } from './db'
import { ok, okVoid, fail } from './result'
import { withRole } from './guard'
import * as s from '@/db/schema'
import { writeAuditLog } from '@/lib/audit/log'

/* ── Schema ── */

const SeoMetaSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.string().optional(),
  canonicalPath: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImageId: z.string().optional(),
  robotsIndex: z.boolean(),
  robotsFollow: z.boolean(),
  schemaType: z.string().optional(),
})

export type SeoMetaInput = z.infer<typeof SeoMetaSchema>

/* ── Read ── */

export async function getSeoMetaList() {
  try {
    const db = getActionDb()
    const items = await db.select().from(s.seoMeta).orderBy(asc(s.seoMeta.entityType), asc(s.seoMeta.locale))
    return ok(items)
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося завантажити SEO-мета')
  }
}

export async function getSeoMeta(id: string) {
  try {
    const db = getActionDb()
    const [item] = await db.select().from(s.seoMeta).where(eq(s.seoMeta.id, id)).limit(1)
    if (!item) return fail('SEO-мета не знайдено')
    return ok(item)
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося завантажити SEO-мета')
  }
}

/* ── Update ── */

export const updateSeoMeta = withRole('EDITOR', async (session, ...args) => {
  try {
    const db = getActionDb()
    const id = args[0] as string
    const [existing] = await db.select().from(s.seoMeta).where(eq(s.seoMeta.id, id)).limit(1)
    if (!existing) return fail('SEO-мета не знайдено')

    const input = SeoMetaSchema.parse(args[1] ?? {})
    await db.update(s.seoMeta).set({
      title: input.title ?? null,
      description: input.description ?? null,
      keywords: input.keywords ?? null,
      canonicalPath: input.canonicalPath ?? null,
      ogTitle: input.ogTitle ?? null,
      ogDescription: input.ogDescription ?? null,
      ogImageId: input.ogImageId ?? null,
      robotsIndex: input.robotsIndex,
      robotsFollow: input.robotsFollow,
      schemaType: input.schemaType ?? null,
    }).where(eq(s.seoMeta.id, id))

    await writeAuditLog({ userId: session.user.id, action: 'UPDATE', entityType: 'SEO_META', entityId: id })
    revalidatePath('/admin/seo')
    return okVoid('SEO-мета оновлено')
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
    return fail(e instanceof Error ? e.message : 'Не вдалося оновити SEO-мета')
  }
})

/* ── Toggle robots ── */

export const toggleSeoRobots = withRole('EDITOR', async (session, ...args) => {
  try {
    const db = getActionDb()
    const id = args[0] as string
    const [existing] = await db.select().from(s.seoMeta).where(eq(s.seoMeta.id, id)).limit(1)
    if (!existing) return fail('SEO-мета не знайдено')

    await db.update(s.seoMeta).set({
      robotsIndex: !existing.robotsIndex,
      robotsFollow: !existing.robotsFollow,
    }).where(eq(s.seoMeta.id, id))

    await writeAuditLog({ userId: session.user.id, action: 'UPDATE', entityType: 'SEO_META', entityId: id })
    revalidatePath('/admin/seo')
    return okVoid(`Індексація ${existing.robotsIndex ? 'вимкнена' : 'увімкнена'}`)
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося змінити robots')
  }
})
