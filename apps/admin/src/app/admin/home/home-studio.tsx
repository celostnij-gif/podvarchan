'use client'

import { useState } from 'react'
import { ZoneNav, type NavKey } from './components/ZoneNav'
import { SaveBanner } from './components/SaveBanner'
import { MetaZone } from './zones/MetaZone'
import { HeroZone } from './zones/HeroZone'
import { ProblemsZone } from './zones/ProblemsZone'
import { MethodZone } from './zones/MethodZone'
import { AuthorZone } from './zones/AuthorZone'
import { ServicesZone } from './zones/ServicesZone'
import { TestimonialsZone } from './zones/TestimonialsZone'
import { FaqZone } from './zones/FaqZone'
import { CtaZone } from './zones/CtaZone'
import { HOME_ZONE_KEYS, parseZoneContent, type HomeZoneKey, type HeroContent } from '@/lib/home/blueprint'
import type { PageSectionRecord, PageSectionTranslationRecord } from '@/app/admin/pages/types'

interface HomeStudioProps {
  pageId: string
  pageStatus: string
  hero: { ru: HeroContent; uk: HeroContent }
  sections: { section: PageSectionRecord; translations: PageSectionTranslationRecord[] }[]
  enabledMap: Record<string, boolean>
  seo: {
    ru: { title: string | null; description: string | null; keywords: string | null } | null
    uk: { title: string | null; description: string | null; keywords: string | null } | null
  }
  counts: { faq: number; testimonials: number; featuredServices: number }
}

/** Parse a zone's content from section translations, per locale. */
function parseZone<K extends HomeZoneKey>(
  sections: { section: PageSectionRecord; translations: PageSectionTranslationRecord[] }[],
  key: K,
): { ru: ReturnType<typeof parseZoneContent<K>>; uk: ReturnType<typeof parseZoneContent<K>> } {
  const sec = sections.find((s) => s.section.key === key)
  const ru = sec?.translations.find((t) => t.locale === 'ru')
  const uk = sec?.translations.find((t) => t.locale === 'uk')
  return {
    ru: parseZoneContent(key, ru?.contentJson),
    uk: parseZoneContent(key, uk?.contentJson),
  }
}

export function HomeStudio({ pageId, pageStatus, hero, sections, enabledMap, seo, counts }: HomeStudioProps) {
  const [activeZone, setActiveZone] = useState<NavKey>('hero')

  const enabled = {} as Record<HomeZoneKey, boolean>
  for (const key of HOME_ZONE_KEYS) {
    enabled[key] = enabledMap[key] ?? true
  }

  const problems = parseZone(sections, 'problems')
  const method = parseZone(sections, 'method')
  const author = parseZone(sections, 'author')
  const services = parseZone(sections, 'services')
  const testimonials = parseZone(sections, 'testimonials')
  const faq = parseZone(sections, 'faq')
  const cta = parseZone(sections, 'cta')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Home Studio</h1>
          <p className="text-sm text-zinc-500 mt-1">Редактор головної сторінки</p>
        </div>
        <a
          href="https://podvarchan.com/ru/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Переглянути на сайті ↗
        </a>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <aside className="w-56 shrink-0">
          <div className="sticky top-24">
            <ZoneNav activeZone={activeZone} onSelect={setActiveZone} enabled={enabled} />
          </div>
        </aside>

        {/* Zone editor */}
        <main className="flex-1 min-w-0">
          <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/40 p-6">
            {activeZone === 'meta' && (
              <MetaZone pageStatus={pageStatus} seo={seo} />
            )}
            {activeZone === 'hero' && (
              <HeroZone data={hero} />
            )}
            {activeZone === 'problems' && (
              <ProblemsZone data={problems} />
            )}
            {activeZone === 'method' && (
              <MethodZone data={method} />
            )}
            {activeZone === 'author' && (
              <AuthorZone data={author} />
            )}
            {activeZone === 'services' && (
              <ServicesZone data={services} featuredCount={counts.featuredServices} />
            )}
            {activeZone === 'testimonials' && (
              <TestimonialsZone data={testimonials} testimonialCount={counts.testimonials} />
            )}
            {activeZone === 'faq' && (
              <FaqZone data={faq} faqCount={counts.faq} />
            )}
            {activeZone === 'cta' && (
              <CtaZone data={cta} />
            )}
          </div>
        </main>
      </div>

      <SaveBanner state="idle" />
    </div>
  )
}
