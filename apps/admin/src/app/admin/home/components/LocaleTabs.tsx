'use client'

interface LocaleTabsProps {
  active: 'ru' | 'uk'
  onChange: (locale: 'ru' | 'uk') => void
}

export function LocaleTabs({ active, onChange }: LocaleTabsProps) {
  return (
    <div className="flex gap-1 p-1 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
      <button
        onClick={() => onChange('ru')}
        className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          active === 'ru'
            ? 'bg-zinc-700 text-amber-400 shadow-sm'
            : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        🇷🇺 RU
      </button>
      <button
        onClick={() => onChange('uk')}
        className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          active === 'uk'
            ? 'bg-zinc-700 text-blue-400 shadow-sm'
            : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        🇺🇦 UK
      </button>
    </div>
  )
}
