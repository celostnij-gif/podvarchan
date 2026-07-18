'use client'

import type { BlockEditorProps } from '../types'
import { TipTapEditor } from '@/components/admin/editor/TipTapEditor'

export function ImageTextEditor({ content, onChange }: BlockEditorProps) {
  const title = (content.title as string) ?? ''
  const body = (content.body as string) ?? ''
  const image = (content.image as string) ?? ''
  const imageAlt = (content.imageAlt as string) ?? ''
  const imagePosition = (content.imagePosition as string) ?? 'left'

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
        <label className="block text-xs font-medium text-zinc-400 mb-1">Текст</label>
        <TipTapEditor value={body} onChange={(html) => update('body', html)} placeholder="Текст блока..." />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">URL изображения</label>
          <input
            value={image}
            onChange={(e) => update('image', e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            placeholder="/api/media/..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Alt текст</label>
          <input
            value={imageAlt}
            onChange={(e) => update('imageAlt', e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            placeholder="Описание изображения"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Расположение изображения</label>
        <div className="flex gap-2">
          {['left', 'right', 'top', 'bottom'].map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => update('imagePosition', pos)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                imagePosition === pos
                  ? 'bg-amber-600/20 text-amber-400 border border-amber-600/30'
                  : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:border-zinc-600'
              }`}
            >
              {pos === 'left' ? 'Слева' : pos === 'right' ? 'Справа' : pos === 'top' ? 'Сверху' : 'Снизу'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
