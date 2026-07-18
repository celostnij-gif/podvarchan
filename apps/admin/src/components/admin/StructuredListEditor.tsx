'use client'

import { useState } from 'react'

interface FieldDef {
  key: string
  label: string
  type?: 'text' | 'textarea'
}

interface StructuredListEditorProps {
  value: string
  onChange: (json: string) => void
  fields: FieldDef[]
  emptyItem: Record<string, string>
  label: string
}

export function StructuredListEditor({ value, onChange, fields, emptyItem, label }: StructuredListEditorProps) {
  const [items, setItems] = useState<Record<string, string>[]>(() => {
    try {
      const parsed = JSON.parse(value || '[]')
      return Array.isArray(parsed) ? parsed : []
    } catch { return [] }
  })

  const updateItems = (newItems: Record<string, string>[]) => {
    setItems(newItems)
    onChange(JSON.stringify(newItems))
  }

  const updateItem = (index: number, key: string, val: string) => {
    const next = items.map((item, i) => (i === index ? { ...item, [key]: val } : item))
    updateItems(next)
  }

  const addItem = () => {
    updateItems([...items, { ...emptyItem }])
  }

  const removeItem = (index: number) => {
    updateItems(items.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-300">{label}</label>
        <button type="button" onClick={addItem}
          className="text-xs rounded-md bg-amber-600/20 px-2.5 py-1 text-amber-400 hover:bg-amber-600/30 transition-colors"
        >+ Додати</button>
      </div>
      {items.length === 0 && (
        <p className="text-xs text-zinc-500 italic">Немає елементів</p>
      )}
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2 rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-3">
          <div className="flex-1 space-y-2">
            {fields.map((f) => (
              f.type === 'textarea' ? (
                <div key={f.key}>
                  <label className="block text-xs text-zinc-500 mb-0.5">{f.label}</label>
                  <textarea
                    value={item[f.key] ?? ''}
                    onChange={(e) => updateItem(i, f.key, e.target.value)}
                    rows={2}
                    className="w-full rounded border border-zinc-700 bg-zinc-900/50 px-2 py-1 text-xs text-zinc-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                  />
                </div>
              ) : (
                <div key={f.key}>
                  <label className="block text-xs text-zinc-500 mb-0.5">{f.label}</label>
                  <input
                    value={item[f.key] ?? ''}
                    onChange={(e) => updateItem(i, f.key, e.target.value)}
                    className="w-full rounded border border-zinc-700 bg-zinc-900/50 px-2 py-1 text-xs text-zinc-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                  />
                </div>
              )
            ))}
          </div>
          <button type="button" onClick={() => removeItem(i)}
            className="shrink-0 mt-1 rounded p-1 text-zinc-600 hover:text-red-400 hover:bg-red-900/20 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      ))}
    </div>
  )
}
