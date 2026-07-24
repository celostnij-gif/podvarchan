'use client'

import { useState, useCallback, useTransition } from 'react'
import { ZoneNav, type NavKey } from './components/ZoneNav'
import { SaveBanner } from './components/SaveBanner'
import { BilingualChecklist } from './components/BilingualChecklist'
import { MetaZone } from './zones/MetaZone'
import { HeroZone } from './zones/HeroZone'
import { ProblemsZone } from './zones/ProblemsZone'
import { MethodZone } from './zones/MethodZone'
import { AuthorZone } from './zones/AuthorZone'
import { ServicesZone } from './zones/ServicesZone'
import { TestimonialsZone } from './zones/TestimonialsZone'
import { FaqZone } from './zones/FaqZone'
import { CtaZone } from './zones/CtaZone'
import { HOME_ZONE_KEYS, HOME_ZONE_META, parseZoneContent, type HomeZoneKey, type HeroContent } from '@/lib/home/blueprint'
import { ensureHomeBlueprint } from '@/lib/actions/home'
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
  /** True when no blueprint sections exist in D1 yet */
  blueprintMissing?: boolean
}

/** Inline blueprint seed banner — shown when D1 has no sections for HOME */
function BlueprintMissingBanner() {
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSeed = () => {
    startTransition(async () => {
      try {
        const res = await ensureHomeBlueprint()
        if (res.created >= 0) setDone(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Помилка')
      }
    })
  }

  if (done) {
    return (
      <div className="rounded-lg border border-green-700/40 bg-green-900/20 px-4 py-3 flex items-center gap-3">
        <span className="text-green-400 text-sm font-medium">✓ Blueprint застосовано — перезавантажте сторінку, щоб побачити дані</span>
        <button
          onClick={() => window.location.reload()}
          className="ml-auto text-xs px-3 py-1.5 rounded-md bg-green-800/40 text-green-300 border border-green-700/40 hover:bg-green-800/70 transition-colors"
        >
          Оновити сторінку
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-amber-600/40 bg-amber-900/20 px-4 py-3 flex items-start gap-3">
      <span className="text-amber-400 text-lg mt-0.5">⚠️</span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-amber-300">Blueprint не застосовано — поля порожні</p>
        <p className="text-xs text-amber-500/80 mt-0.5">
          В D1 немає секцій для головної сторінки. Натисніть «Застосувати», щоб створити їх із типовим вмістом.
        </p>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
      <button
        onClick={handleSeed}
        disabled={pending}
        className="shrink-0 px-4 py-1.5 rounded-md bg-amber-600/20 text-amber-300 border border-amber-600/40 text-sm font-medium hover:bg-amber-600/30 transition-colors disabled:opacity-50"
      >
        {pending ? 'Створення...' : 'Застосувати Blueprint'}
      </button>
    </div>
  )
}

/** Always-visible Blueprint management section — seed/re-seed zones and translations. */
function BlueprintSection() {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok?: boolean; created?: number; error?: string } | null>(null)

  const handleSeed = () => {
    setResult(null)
    startTransition(async () => {
      try {
        const res = await ensureHomeBlueprint()
        setResult({ ok: true, created: res.created })
      } catch (e) {
        setResult({ error: e instanceof Error ? e.message : 'Помилка' })
      }
    })
  }

  return (
    <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/40 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">📋</span>
            <h3 className="text-base font-semibold text-zinc-100">Blueprint — схема секцій головної сторінки</h3>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">
            За потреби створює відсутні секції та переклади з типовими значеннями.
            Безпечно використовувати повторно — існуючі дані не перезаписуються.
            Зони: {HOME_ZONE_KEYS.map(k => HOME_ZONE_META[k].label.replace(/\s*\/.*$/, '')).join(', ')}.
          </p>
        </div>
        <button
          onClick={handleSeed}
          disabled={pending}
          className="shrink-0 px-4 py-2 rounded-lg bg-zinc-700/50 text-zinc-300 border border-zinc-600/50 text-sm font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {pending ? (
            <><span className="inline-block w-3 h-3 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" /> Створення...</>
          ) : (
            'Застосувати Blueprint'
          )}
        </button>
      </div>
      {result?.ok && result.created !== undefined && (
        <div className="mt-3 flex items-center gap-2 text-sm text-green-400 bg-green-900/20 border border-green-700/30 rounded-lg px-3 py-2">
          <span>✓</span>
          <span>Blueprint застосовано: створено {result.created} елементів. {result.created > 0 ? 'Оновіть сторінку.' : 'Усі секції вже існують.'}</span>
          {result.created === 0 && (
            <button
              onClick={() => window.location.reload()}
              className="ml-auto text-xs px-2 py-1 rounded bg-green-800/40 text-green-300 border border-green-700/40 hover:bg-green-800/70 transition-colors"
            >
              Оновити
            </button>
          )}
        </div>
      )}
      {result?.error && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-400 bg-red-900/20 border border-red-700/30 rounded-lg px-3 py-2">
          <span>⚠</span>
          <span>{result.error}</span>
        </div>
      )}
    </div>
  )
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

export function HomeStudio({ pageId, pageStatus, hero, sections, enabledMap, seo, counts, blueprintMissing }: HomeStudioProps) {
  const [activeZone, setActiveZone] = useState<NavKey>('hero')
  const [enabledState, setEnabledState] = useState<Record<string, boolean>>(enabledMap)

  const enabled = {} as Record<HomeZoneKey, boolean>
  for (const key of HOME_ZONE_KEYS) {
    enabled[key] = enabledState[key] ?? true
  }

  const handleToggle = useCallback((zone: HomeZoneKey, newEnabled: boolean) => {
    setEnabledState((prev) => ({ ...prev, [zone]: newEnabled }))
  }, [])

  const problems = parseZone(sections, 'problems')
  const method = parseZone(sections, 'method')
  const author = parseZone(sections, 'author')
  const services = parseZone(sections, 'services')
  const testimonials = parseZone(sections, 'testimonials')
  const faq = parseZone(sections, 'faq')
  const cta = parseZone(sections, 'cta')

  return (
    <div className="space-y-6">
      {blueprintMissing && <BlueprintMissingBanner />}
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
          <div className="sticky top-24 space-y-4">
            <ZoneNav activeZone={activeZone} onSelect={setActiveZone} enabled={enabled} onToggle={handleToggle} />
            <BilingualChecklist sections={sections} enabledMap={enabledState} hero={hero} />
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

      {/* Blueprint — always visible, not hidden in a sub-tab */}
      <BlueprintSection />

      <SaveBanner state="idle" />
    </div>
  )
}
