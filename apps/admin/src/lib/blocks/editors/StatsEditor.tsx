'use client'

import type { BlockEditorProps } from '../types'

interface StatItem {
  label?: string
  value?: string
}

export function StatsEditor({ content, onChange }: BlockEditorProps) {
  const title = (content.title as string) ?? ''
  const items = (content.items as StatItem[]) ?? []

  const updateTitle = (value: string) => {
    onChange({ ...content, title: value })
  }

  const updateItem = (index: number, field: keyof StatItem, value: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    onChange({ ...content, items: newItems })
  }

  const addItem = () => {
    onChange({ ...content, items: [...items, { label: '', value: '' }] })
  }

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    onChange({ ...content, items: newItems })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Заголовок</label>
        <input
          value={title}
          onChange={(e) => updateTitle(e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          placeholder="Статистика"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-2">Элементы статистики</label>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border border-zinc-700/50 bg-zinc-900/30 p-2">
              <input
                value={item.value ?? ''}
                onChange={(e) => updateItem(i, 'value', e.target.value)}
                className="w-20 rounded border border-zinc-700 bg-zinc-800/50 px-2 py-1.5 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none"
                placeholder="500+"
              />
              <input
                value={item.label ?? ''}
                onChange={(e) => updateItem(i, 'label', e.target.value)}
                className="flex-1 rounded border border-zinc-700 bg-zinc-800/50 px-2 py-1.5 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none"
                placeholder="Клиентов"
              />
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="shrink-0 rounded px-1.5 py-1 text-xs text-red-400 hover:bg-red-900/30"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addItem}
            className="w-full rounded-lg border border-dashed border-zinc-700/50 py-2 text-xs text-zinc-500 hover:border-zinc-600 hover:text-zinc-400 transition-colors"
          >
            + Добавить элемент
          </button>
        </div>
      </div>
    </div>
  )
}
