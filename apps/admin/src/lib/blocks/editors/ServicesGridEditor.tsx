'use client'

import type { BlockEditorProps } from '../types'

export function ServicesGridEditor({ content, onChange }: BlockEditorProps) {
  const title = (content.title as string) ?? ''
  const subtitle = (content.subtitle as string) ?? ''
  const showFeatured = (content.showFeatured as boolean) ?? false
  const maxItems = (content.maxItems as number) ?? 6

  const update = (field: string, value: string | boolean | number) => {
    onChange({ ...content, [field]: value })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Заголовок</label>
        <input
          value={title}
          onChange={(e) => update('title', e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          placeholder="Мои услуги"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Подзаголовок</label>
        <textarea
          value={subtitle}
          onChange={(e) => update('subtitle', e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          placeholder="Краткое описание списка услуг"
        />
      </div>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={showFeatured}
            onChange={(e) => update('showFeatured', e.target.checked)}
            className="rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500"
          />
          Только избранные
        </label>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Макс. услуг</label>
          <input
            type="number"
            min={1}
            max={50}
            value={maxItems}
            onChange={(e) => update('maxItems', parseInt(e.target.value) || 6)}
            className="w-20 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>
      </div>
      <div className="rounded-lg border border-dashed border-zinc-700/50 bg-zinc-900/20 p-3">
        <p className="text-xs text-zinc-500">
          ⚡ Услуги загружаются из CRM автоматически. Фильтр &quot;Только избранные&quot; покажет только услуги с отметкой featured.
        </p>
      </div>
    </div>
  )
}
