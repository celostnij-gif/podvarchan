'use client'

import type { BlockEditorProps } from '../types'

export function HeroEditor({ content, onChange }: BlockEditorProps) {
  const title = (content.title as string) ?? ''
  const subtitle = (content.subtitle as string) ?? ''
  const cta = (content.cta as string) ?? ''

  const update = (field: string, value: string) => {
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
          placeholder="Ваш внутренний мир заслуживает внимания"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Подзаголовок</label>
        <textarea
          value={subtitle}
          onChange={(e) => update('subtitle', e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          placeholder="Гипнотерапия и глубинная психология..."
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Текст кнопки (CTA)</label>
        <input
          value={cta}
          onChange={(e) => update('cta', e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          placeholder="Записаться на консультацию"
        />
      </div>
    </div>
  )
}
