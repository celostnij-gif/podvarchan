import type { Metadata } from 'next'
import { getDB } from '@/db'
import { pages, pageTranslations, pageSections, pageSectionTranslations } from '@/db/schema/pages'
import { seoMeta } from '@/db/schema/seo'
import { faqItems } from '@/db/schema/faq'
import { testimonials } from '@/db/schema/testimonials'
import { services } from '@/db/schema/services'
import { eq, and, count } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { HomeStudio } from './home-studio'
import { parseZoneContent } from '@/lib/home/blueprint'
import type { PageSectionRecord, PageSectionTranslationRecord } from '@/app/admin/pages/types'

export const metadata: Metadata = {
  title: 'Головна — Studio',
}

export default async function HomePage() {
  const db = getDB()

  const home = await db.select().from(pages).where(eq(pages.type, 'HOME')).get()
  if (!home) notFound()

  // Translations + SEO
  const translationRows = await db
    .select()
    .from(pageTranslations)
    .where(eq(pageTranslations.pageId, home.id))
    .all()

  const seoRows = await db
    .select()
    .from(seoMeta)
    .where(and(eq(seoMeta.entityType, 'page'), eq(seoMeta.entityId, home.id)))
    .all()

  const seoMap = { ru: null as typeof seoRows[0] | null, uk: null as typeof seoRows[0] | null }
  for (const row of seoRows) {
    if (row.locale === 'ru') seoMap.ru = row
    if (row.locale === 'uk') seoMap.uk = row
  }

  // Sections with translations
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

  // Parse hero content from section translations (not from page_translations.contentJson)
  const heroSection = sections.find((s) => s.section.key === 'hero')
  const heroData = { ru: { title: '', subtitle: '', ctaPrimary: '', ctaSecondary: '', benefits: [] as string[] }, uk: { title: '', subtitle: '', ctaPrimary: '', ctaSecondary: '', benefits: [] as string[] } }

  if (heroSection) {
    for (const locale of ['ru', 'uk'] as const) {
      const tr = heroSection.translations.find((t) => t.locale === locale)
      if (tr?.contentJson) {
        heroData[locale] = parseZoneContent('hero', tr.contentJson)
      }
    }
  }

  // Enabled map for zone nav
  const enabledMap = {} as Record<string, boolean>
  for (const s of sections) {
    enabledMap[s.section.key] = s.section.enabled
  }

  // Counts for linked entities
  const [faqCount] = await db.select({ value: count() }).from(faqItems).where(eq(faqItems.group, 'HOME')).all()
  const [testimonialCount] = await db.select({ value: count() }).from(testimonials).where(eq(testimonials.status, 'PUBLISHED')).all()
  const [featuredCount] = await db.select({ value: count() }).from(services).where(and(eq(services.featured, true), eq(services.status, 'PUBLISHED'))).all()

  return (
    <HomeStudio
      pageId={home.id}
      pageStatus={home.status}
      hero={heroData}
      sections={sections}
      enabledMap={enabledMap}
      seo={{ ru: seoMap.ru, uk: seoMap.uk }}
      blueprintMissing={sections.length === 0}
      counts={{
        faq: faqCount?.value ?? 0,
        testimonials: testimonialCount?.value ?? 0,
        featuredServices: featuredCount?.value ?? 0,
      }}
    />
  )
}
