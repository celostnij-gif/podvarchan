'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Search, Trash2, Plus, Save, FileJson } from 'lucide-react'
import { listBlockTemplates, deleteBlockTemplate, saveBlockTemplate } from '@/lib/actions/blockTemplates'
import { getBlockDefinition } from '@/lib/blocks/registry'
import { BlockPreview } from '@/lib/blocks/BlockPreview'
import type { BlockTemplate } from '@/lib/actions/blockTemplates'

interface BlockLibraryDialogProps {
  open: boolean
  onClose: () => void
  onSelectTemplate: (template: { sectionType: string; contentRu: string; contentUk: string }) => void
}

/**
 * BlockLibraryDialog — browse, preview, select, and delete block templates.
 */
export function BlockLibraryDialog({ open, onClose, onSelectTemplate }: BlockLibraryDialogProps) {
  const [templates, setTemplates] = useState<BlockTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const loadTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const list = await listBlockTemplates()
      setTemplates(list)
    } catch (err) {
      console.error('Failed to load templates:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (open) { loadTemplates(); setSelectedId(null); setSearch('') } }, [open, loadTemplates])

  const handleDelete = useCallback(async (id: string, name: string) => {
    if (!confirm(`Видалити шаблон "${name}"?`)) return
    await deleteBlockTemplate(id)
    setTemplates((prev) => prev.filter((t) => t.id !== id))
    if (selectedId === id) setSelectedId(null)
  }, [selectedId])

  const handleSelect = useCallback((tpl: BlockTemplate) => {
    onSelectTemplate({
      sectionType: tpl.sectionType,
      contentRu: JSON.stringify(tpl.contentRu),
      contentUk: JSON.stringify(tpl.contentUk),
    })
    onClose()
  }, [onSelectTemplate, onClose])

  const filtered = search.trim()
    ? templates.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.sectionType.toLowerCase().includes(search.toLowerCase()),
      )
    : templates

  const selected = templates.find((t) => t.id === selectedId)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-4xl max-h-[85vh] rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
          <h2 className="text-base font-semibold text-zinc-100">📚 Библиотека шаблонов</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-zinc-800/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск шаблонов по имени или типу..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 pl-9 pr-3 py-2 text-sm text-zinc-200 placeholder-zinc-500
                         focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Template list */}
          <div className="w-2/5 border-r border-zinc-800 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <span className="text-sm text-zinc-500">Загрузка...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
                <FileJson className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">
                  {search ? 'Ничего не найдено' : 'Шаблонов пока нет'}
                </p>
                {!search && (
                  <p className="text-xs mt-1">
                    Сохраните блок как шаблон из редактора
                  </p>
                )}
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/50">
                {filtered.map((tpl) => {
                  const def = getBlockDefinition(tpl.sectionType)
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setSelectedId(tpl.id)}
                      onDoubleClick={() => handleSelect(tpl)}
                      className={`w-full text-left px-4 py-3 transition-colors hover:bg-zinc-800/50 ${
                        selectedId === tpl.id ? 'bg-zinc-800 border-l-2 border-amber-500' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{def?.icon ?? '🧩'}</span>
                        <span className="text-sm font-medium text-zinc-200 truncate">{tpl.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
                          {tpl.sectionType}
                        </span>
                        <span className="text-[10px] text-zinc-600">
                          {new Date(tpl.updated).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Preview pane */}
          <div className="flex-1 overflow-y-auto p-4">
            {selected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-zinc-200">{selected.name}</h3>
                    <p className="text-xs text-zinc-500">
                      {getBlockDefinition(selected.sectionType)?.label ?? selected.sectionType}
                      {' · '}
                      {new Date(selected.updated).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelect(selected)}
                      className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-500 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                      Вставить
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(selected.id, selected.name)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/30 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                      Удалить
                    </button>
                  </div>
                </div>

                {/* Template preview — RU */}
                <div className="rounded-lg border border-zinc-700/50 overflow-hidden">
                  <div className="flex items-center gap-2 bg-zinc-800/30 px-3 py-1.5 border-b border-zinc-700/50">
                    <span className="text-[10px] font-medium text-amber-400">🇷🇺 Русский</span>
                  </div>
                  <div className="p-3">
                    <BlockPreview
                      sectionType={selected.sectionType}
                      content={selected.contentRu}
                      locale="ru"
                    />
                  </div>
                </div>

                {/* Template preview — UK */}
                <div className="rounded-lg border border-zinc-700/50 overflow-hidden">
                  <div className="flex items-center gap-2 bg-zinc-800/30 px-3 py-1.5 border-b border-zinc-700/50">
                    <span className="text-[10px] font-medium text-blue-400">🇺🇦 Українська</span>
                  </div>
                  <div className="p-3">
                    <BlockPreview
                      sectionType={selected.sectionType}
                      content={selected.contentUk}
                      locale="uk"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-600 py-12">
                <FileJson className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">
                  {'Выберите шаблон для просмотра'}
                </p>
                <p className="text-xs mt-1 text-zinc-700">
                  {'или дважды кликните, чтобы вставить'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 px-5 py-2.5 flex items-center justify-between">
          <span className="text-xs text-zinc-600">
            {templates.length} {templates.length === 1 ? 'шаблон' : 'шаблонов'}
            {search && filtered.length !== templates.length && ` · найдено ${filtered.length}`}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  )
}
