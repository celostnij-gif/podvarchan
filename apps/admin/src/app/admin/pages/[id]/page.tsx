import { getDB } from '@/db'
import { pages, pageTranslations, pageSections, pageSectionTranslations } from '@/db/schema/pages'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { EditPageForm } from './edit-form'
import ViewOnSiteLink from '@/components/admin/ViewOnSiteLink'
import PreviewButton from '@/components/admin/PreviewButton'
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
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-100">
          Редагувати сторінку
        </h1>
        <div className="flex items-center gap-2">
          {page.status === 'PUBLISHED' && (
            <>
              {page.type === 'HOME' ? (
                <>
                  <ViewOnSiteLink href="/ru/" />
                  <ViewOnSiteLink href="/uk/" />
                </>
              ) : (
                (() => {
                  const ruSlug = translations.find((t) => t.locale === 'ru')?.slug
                  const ukSlug = translations.find((t) => t.locale === 'uk')?.slug
                  return (
                    <>
                      {ruSlug && <ViewOnSiteLink href={`/ru/${ruSlug}`} />}
                      {ukSlug && <ViewOnSiteLink href={`/uk/${ukSlug}`} />}
                    </>
                  )
                })()
              )}
            </>
          )}
          <PreviewButton
            entityType="page"
            slug={page.type}
            publicPath={page.type === 'HOME' ? '/ru/' : `/ru/${translations.find((t) => t.locale === 'ru')?.slug || page.type.toLowerCase()}`}
          />
          <a
            href={`/admin/seo/page/${page.id}`}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            SEO
          </a>
        </div>
      </div>

      <EditPageForm page={page} translations={translations} sections={sections} />
    </div>
  )
}
