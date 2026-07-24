'use client'

import { HOME_ZONE_META, type HomeZoneKey } from '@/lib/home/blueprint'
import type { PageSectionRecord, PageSectionTranslationRecord } from '@/app/admin/pages/types'

interface BilingualChecklistProps {
  sections: { section: PageSectionRecord; translations: PageSectionTranslationRecord[] }[]
  enabledMap: Record<string, boolean>
  hero: { ru: { title: string }; uk: { title: string } }
}

interface ZoneStatus {
  key: HomeZoneKey
  label: string
  ru: boolean
  uk: boolean
  enabled: boolean
}

export function BilingualChecklist({ sections, enabledMap, hero }: BilingualChecklistProps) {
  const zones: ZoneStatus[] = (Object.keys(HOME_ZONE_META) as HomeZoneKey[]).map((key) => {
    const sec = sections.find((s) => s.section.key === key)
    const ru = sec?.translations.some((t) => t.locale === 'ru' && t.contentJson && t.contentJson !== '{}') ?? false
    const uk = sec?.translations.some((t) => t.locale === 'uk' && t.contentJson && t.contentJson !== '{}') ?? false
    return {
      key,
      label: HOME_ZONE_META[key].label,
      ru,
      uk,
      enabled: enabledMap[key] ?? true,
    }
  })

  // Hero is special — title lives in page_translations, not section translations
  const heroRu = Boolean(hero.ru.title)
  const heroUk = Boolean(hero.uk.title)

  const allComplete = zones.every((z) => !z.enabled || (z.ru && z.uk)) && heroRu && heroUk
  const countComplete = zones.filter((z) => z.enabled && z.ru && z.uk).length + (heroRu && heroUk ? 1 : 0)
  const countEnabled = zones.filter((z) => z.enabled).length + 1 // +1 for hero (always enabled)

  return (
    <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/40 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-zinc-300">Двомовність</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          allComplete ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'
        }`}>
          {countComplete}/{countEnabled}
        </span>
      </div>

      <div className="space-y-1.5">
        {/* Hero row */}
        <div className="flex items-center gap-2 text-xs">
          <CheckDot ok={heroRu} />
          <CheckDot ok={heroUk} />
          <span className="text-zinc-400">Hero (заголовок)</span>
        </div>

        {zones.map((z) => (
          <div key={z.key} className={`flex items-center gap-2 text-xs ${!z.enabled ? 'opacity-40' : ''}`}>
            <CheckDot ok={z.ru} />
            <CheckDot ok={z.uk} />
            <span className="text-zinc-400">{z.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CheckDot({ ok }: { ok: boolean }) {
  return (
    <span className={`w-3 h-3 rounded-full flex items-center justify-center shrink-0 ${
      ok ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700/50 text-zinc-600'
    }`}>
      {ok ? '✓' : '·'}
    </span>
  )
}
