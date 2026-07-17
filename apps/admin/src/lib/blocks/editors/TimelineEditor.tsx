'use client'

import type { BlockEditorProps } from '../types'

interface TimelineItem {
  year?: string
  title?: string
  description?: string
}

export function TimelineEditor({ content, onChange }: BlockEditorProps) {
  const title = (content.title as string) ?? ''
  const items = (content.items as TimelineItem[]) ?? []

  const updateTitle = (value: string) => {
    onChange({ ...content, title: value })
  }

  const updateItem = (index: number, field: keyof TimelineItem, value: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    onChange({ ...content, items: newItems })
  }

  const addItem = () => {
    onChange({ ...content, items: [...items, { year: '', title: '', description: '' }] })
  }

  const removeItem = (index: number) => {
    onChange({ ...content, items: items.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Заголовок</label>
        <input
          value={title}
          onChange={(e) => updateTitle(e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          placeholder="Мой путь"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-2">События таймлайна</label>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="relative rounded-lg border border-zinc-700/50 bg-zinc-900/30 p-3">
              <div className="absolute right-2 top-2">
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="rounded px-1.5 py-0.5 text-xs text-red-400 hover:bg-red-900/30"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-2">
                <div>
                  <label className="block text-[10px] font-medium text-zinc-500 mb-0.5">Год</label>
                  <input
                    value={item.year ?? ''}
                    onChange={(e) => updateItem(i, 'year', e.target.value)}
                    className="w-full rounded border border-zinc-700 bg-zinc-800/50 px-2 py-1.5 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none"
                    placeholder="2024"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-[10px] font-medium text-zinc-500 mb-0.5">Заголовок</label>
                  <input
                    value={item.title ?? ''}
                    onChange={(e) => updateItem(i, 'title', e.target.value)}
                    className="w-full rounded border border-zinc-700 bg-zinc-800/50 px-2 py-1.5 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none"
                    placeholder="Событие"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-zinc-500 mb-0.5">Описание</label>
                <textarea
                  value={item.description ?? ''}
                  onChange={(e) => updateItem(i, 'description', e.target.value)}
                  rows={2}
                  className="w-full rounded border border-zinc-700 bg-zinc-800/50 px-2 py-1.5 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none"
                  placeholder="Описание события..."
                />
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-xs text-zinc-600 text-center py-4 border border-dashed border-zinc-800 rounded-lg">
              Пока нет событий — добавьте первое
            </p>
          )}
          <button
            type="button"
            onClick={addItem}
            className="w-full rounded-lg border border-dashed border-zinc-700/50 py-2 text-xs text-zinc-500 hover:border-zinc-600 hover:text-zinc-400 transition-colors"
          >
            + Добавить событие
          </button>
        </div>
      </div>
    </div>
  )
}
