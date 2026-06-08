'use server'

/**
 * Server Actions для модуля «Страницы».
 */

import { eq, asc, and } from 'drizzle-orm'
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

/* ═══════════════════════════════════════
   Home Page Editor
   ═══════════════════════════════════════ */

export async function getHomePage(_locale?: string) {
  try {
    const db = getActionDb()
    const [page] = await db.select().from(s.pages).where(eq(s.pages.type, 'HOME')).limit(1)
    if (!page) return fail('Головну сторінку не знайдено')

    const sections = await db.select().from(s.pageSections)
      .where(eq(s.pageSections.pageId, page.id))
      .orderBy(asc(s.pageSections.sortOrder))

    // Fetch translations per section
    const sectionsWithTranslations = await Promise.all(sections.map(async (section) => {
      const translations = await db.select().from(s.pageSectionTranslations)
        .where(eq(s.pageSectionTranslations.sectionId, section.id))
      return { ...section, translations }
    }))

    // Get page translations
    const pageTranslations = await db.select().from(s.pageTranslations)
      .where(eq(s.pageTranslations.pageId, page.id))

    return ok({ ...page, sections: sectionsWithTranslations, translations: pageTranslations })
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося завантажити головну сторінку')
  }
}

export const updateSectionSettings = withRole('EDITOR', async (session, ...args) => {
  try {
    const db = getActionDb()
    const sectionId = args[0] as string
    const settings = args[1] as Record<string, unknown>
    await db.update(s.pageSections).set({ settingsJson: JSON.stringify(settings) }).where(eq(s.pageSections.id, sectionId))
    await writeAuditLog({ userId: session.user.id, action: 'UPDATE', entityType: 'PAGE_SECTION', entityId: sectionId })
    revalidatePath('/admin/home')
    return okVoid('Налаштування секції збережено')
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося зберегти налаштування секції')
  }
})

export const updateSectionTranslation = withRole('EDITOR', async (session, ...args) => {
  try {
    const db = getActionDb()
    const sectionId = args[0] as string
    const locale = args[1] as 'ru' | 'uk'
    const contentJson = args[2] as string

    const [existing] = await db.select().from(s.pageSectionTranslations)
      .where(and(eq(s.pageSectionTranslations.sectionId, sectionId), eq(s.pageSectionTranslations.locale, locale)))
      .limit(1)

    if (existing) {
      await db.update(s.pageSectionTranslations).set({ contentJson }).where(eq(s.pageSectionTranslations.id, existing.id))
    } else {
      await db.insert(s.pageSectionTranslations).values({ id: crypto.randomUUID(), sectionId, locale, contentJson })
    }

    await writeAuditLog({ userId: session.user.id, action: 'UPDATE', entityType: 'PAGE_SECTION', entityId: sectionId })
    revalidatePath('/admin/home')
    return okVoid('Переклад секції збережено')
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося зберегти переклад секції')
  }
})
