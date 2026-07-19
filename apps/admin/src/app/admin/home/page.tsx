import type { Metadata } from 'next'
import { getDB } from '@/db'
import { pages, pageTranslations, pageSections, pageSectionTranslations } from '@/db/schema/pages'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { HomeEditor } from './home-editor'
import type { PageTranslationRecord, PageSectionRecord, PageSectionTranslationRecord } from '@/app/admin/pages/types'

export const metadata: Metadata = {
  title: 'Головна',
}

export default async function HomePage() {
  const db = getDB()

  const home = await db.select().from(pages).where(eq(pages.type, 'HOME')).get()
  if (!home) notFound()

  const translationRows = await db
    .select()
    .from(pageTranslations)
    .where(eq(pageTranslations.pageId, home.id))
    .all()

  const translations = translationRows.map((t) => t as PageTranslationRecord)

  const sectionRows = await db
    .select()
    .from(pageSections)
    .leftJoin(pageSectionTranslations, eq(pageSections.id, pageSectionTranslations.sectionId))
    .where(eq(pageSections.pageId, home.id))
    .orderBy(pageSections.sortOrder)
    .all()

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

  // Parse hero content from contentJson
  const ruTr = translations.find((t) => t.locale === 'ru')
  const ukTr = translations.find((t) => t.locale === 'uk')

  let ruHero = { title: '', subtitle: '', cta: '' }
  let ukHero = { title: '', subtitle: '', cta: '' }

  try {
    if (ruTr?.contentJson) {
      const parsed = JSON.parse(ruTr.contentJson)
      ruHero = parsed.hero ?? ruHero
    }
  } catch { /* ignore */ }

  try {
    if (ukTr?.contentJson) {
      const parsed = JSON.parse(ukTr.contentJson)
      ukHero = parsed.hero ?? ukHero
    }
  } catch { /* ignore */ }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Редактор головної</h1>
        <p className="text-sm text-zinc-500 mt-1">Керування вмістом головної сторінки</p>
      </div>

      <HomeEditor
        pageId={home.id}
        status={home.status}
        tr={{ ru: ruTr ?? null, uk: ukTr ?? null }}
        hero={{ ru: ruHero, uk: ukHero }}
        sections={sections}
      />
    </div>
  )
}
