'use client'

import type { BlockEditorProps } from '../types'

export function TextBlockEditor({ content, onChange }: BlockEditorProps) {
  const title = (content.title as string) ?? ''
  const body = (content.body as string) ?? ''

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
          placeholder="Заголовок блока"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Текст (HTML)</label>
        <textarea
          value={body}
          onChange={(e) => update('body', e.target.value)}
          rows={6}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm font-mono text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          placeholder="<p>Текст в HTML формате...</p>"
        />
      </div>
    </div>
  )
}
