import { getDB } from '@/db'
import { pages, pageTranslations, pageSections, pageSectionTranslations } from '@/db/schema/pages'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { EditPageForm } from './edit-form'
import type { PageTranslationRecord, PageSectionRecord, PageSectionTranslationRecord } from '../types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditPagePage(props: Props) {
  const { id } = await props.params
  const db = getDB()

  const page = await db.select().from(pages).where(eq(pages.id, id)).get()
  if (!page) notFound()

  const translationRows = await db
    .select()
    .from(pageTranslations)
    .where(eq(pageTranslations.pageId, id))
    .all()

  const translations = translationRows.map((t) => t as PageTranslationRecord)

  const sectionRows = await db
    .select()
    .from(pageSections)
    .leftJoin(pageSectionTranslations, eq(pageSections.id, pageSectionTranslations.sectionId))
    .where(eq(pageSections.pageId, id))
    .orderBy(pageSections.sortOrder)
    .all()

  // Group section translations
  const sectionsMap = new Map<string, { section: PageSectionRecord; translations: PageSectionTranslationRecord[] }>()
  for (const row of sectionRows) {
    if (!sectionsMap.has(row.page_sections.id)) {
      sectionsMap.set(row.page_sections.id, {
        section: row.page_sections as PageSectionRecord,
        translations: [],
      })
    }
    const st = row.page_section_translations
    if (st) {
      sectionsMap.get(row.page_sections.id)!.translations.push(st as PageSectionTranslationRecord)
    }
  }
  const sections = Array.from(sectionsMap.values())

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-zinc-100">
        Редактировать страницу
      </h1>

      <EditPageForm page={page} translations={translations} sections={sections} />
    </div>
  )
}
