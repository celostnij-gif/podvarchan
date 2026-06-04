'use server'

/**
 * Server Actions для модуля «Страницы».
 */

import { eq, asc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getActionDb } from './db'
import { ok, okVoid, fail } from './result'
import { withRole } from './guard'
import * as s from '@/db/schema'
import { writeAuditLog } from '@/lib/audit/log'

export async function getPages() {
  try {
    const db = getActionDb()
    const items = await db.select().from(s.pages).orderBy(asc(s.pages.sortOrder))
    const translations = await db.select().from(s.pageTranslations)
    return ok({ pages: items, translations })
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося завантажити сторінки')
  }
}

export async function getPage(id: string) {
  try {
    const db = getActionDb()
    const [page] = await db.select().from(s.pages).where(eq(s.pages.id, id)).limit(1)
    if (!page) return fail('Сторінку не знайдено')

    const translations = await db.select().from(s.pageTranslations).where(eq(s.pageTranslations.pageId, id))
    const sections = await db.select().from(s.pageSections).where(eq(s.pageSections.pageId, id)).orderBy(asc(s.pageSections.sortOrder))

    return ok({ ...page, translations, sections })
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося завантажити сторінку')
  }
}

export const updatePageStatus = withRole('EDITOR', async (session, ...args) => {
  try {
    const db = getActionDb()
    const id = args[0] as string
    const status = (args[1] ?? 'DRAFT') as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
    const [existing] = await db.select().from(s.pages).where(eq(s.pages.id, id)).limit(1)
    if (!existing) return fail('Сторінку не знайдено')

    await db.update(s.pages).set({
      status,
      publishedAt: status === 'PUBLISHED' ? new Date() : existing.publishedAt,
    }).where(eq(s.pages.id, id))

    await writeAuditLog({ userId: session.user.id, action: status === 'PUBLISHED' ? 'PUBLISH' : 'UPDATE', entityType: 'PAGE', entityId: id })
    revalidatePath('/admin/pages')
    return okVoid(`Сторінку переведено в статус «${status}»`)
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося змінити статус сторінки')
  }
})

export const togglePageSection = withRole('EDITOR', async (session, ...args) => {
  try {
    const db = getActionDb()
    const sectionId = args[0] as string
    const enabled = Boolean(args[1] ?? true)
    const [section] = await db.select().from(s.pageSections).where(eq(s.pageSections.id, sectionId)).limit(1)
    if (!section) return fail('Секцію не знайдено')

    await db.update(s.pageSections).set({ enabled }).where(eq(s.pageSections.id, sectionId))
    revalidatePath(`/admin/pages/${section.pageId}`)
    return okVoid(enabled ? 'Секцію увімкнено' : 'Секцію вимкнено')
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося змінити секцію')
  }
})
