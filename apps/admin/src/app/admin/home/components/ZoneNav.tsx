'use client'

import { useTransition } from 'react'
import { HOME_ZONE_KEYS, HOME_ZONE_META, type HomeZoneKey } from '@/lib/home/blueprint'
import { toggleHomeZone } from '@/lib/actions/home'

export type NavKey = 'meta' | HomeZoneKey

const NAV_ITEMS: { key: NavKey; label: string }[] = [
  { key: 'meta', label: 'Параметри / SEO' },
  ...HOME_ZONE_KEYS.map((k) => ({ key: k as NavKey, label: HOME_ZONE_META[k].label })),
]

interface ZoneNavProps {
  activeZone: NavKey
  onSelect: (zone: NavKey) => void
  enabled: Record<HomeZoneKey, boolean>
  onToggle?: (zone: HomeZoneKey, newEnabled: boolean) => void
}

export function ZoneNav({ activeZone, onSelect, enabled, onToggle }: ZoneNavProps) {
  const [pending, startTransition] = useTransition()

  const handleToggle = (zone: HomeZoneKey, e: React.MouseEvent) => {
    e.stopPropagation()
    startTransition(async () => {
      const result = await toggleHomeZone(zone)
      if (result.ok) {
        onToggle?.(zone, result.enabled)
      }
    })
  }

  return (
    <nav className="space-y-1" aria-label="Зони головної">
      {NAV_ITEMS.map(({ key, label }) => {
        const isActive = key === activeZone
        const on = key === 'meta' || enabled[key as HomeZoneKey]
        const isZone = key !== 'meta'

        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              isActive
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent'
            }`}
          >
            {isZone ? (
              <button
                onClick={(e) => handleToggle(key as HomeZoneKey, e)}
                disabled={pending}
                className="w-2 h-2 rounded-full shrink-0 cursor-pointer hover:scale-150 transition-transform"
                title={on ? 'Вимкнути зону' : 'Увімкнути зону'}
              >
                <span className={`block w-2 h-2 rounded-full ${on ? 'bg-green-400' : 'bg-zinc-600'}`} />
              </button>
            ) : (
              <span className="w-2 h-2 rounded-full shrink-0 bg-zinc-500" />
            )}
            <span className={`flex-1 text-left ${!on && isZone ? 'text-zinc-600' : ''}`}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
