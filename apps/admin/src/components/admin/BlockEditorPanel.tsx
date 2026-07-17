'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { getBlockDefinition, serializeBlockContent } from '@/lib/blocks/registry'
import { DynamicBlockEditor } from '@/lib/blocks/DynamicBlockEditor'
import { BlockPreview } from '@/lib/blocks/BlockPreview'
import type { BlockContent, FieldDefinition } from '@/lib/blocks/types'

interface BlockEditorPanelProps {
  sectionType: string
  sectionKey: string
  content: BlockContent
  onSave: (locale: 'ru' | 'uk', contentJson: string) => void
  isPending?: boolean
}

/**
 * Universal Block Editor Panel with live preview.
 *
 * Maintains local state for instant editor updates and debounces
 * saves to the server. A toggle switch shows the live preview panel.
 */
export function BlockEditorPanel({ sectionType, sectionKey, content, onSave, isPending }: BlockEditorPanelProps) {
  const def = getBlockDefinition(sectionType)
  const [showPreview, setShowPreview] = useState(false)
  const [previewLocale, setPreviewLocale] = useState<'ru' | 'uk'>('ru')

  // Local content state for live preview (updated immediately on editor changes)
  const [localRu, setLocalRu] = useState<Record<string, unknown>>(content.ru)
  const [localUk, setLocalUk] = useState<Record<string, unknown>>(content.uk)

  // Sync from props when content changes externally (e.g. after save)
  useEffect(() => {
    setLocalRu(content.ru)
    setLocalUk(content.uk)
  }, [content.ru, content.uk])

  // Debounce save ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleSave = useCallback((locale: 'ru' | 'uk', data: Record<string, unknown>) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const json = serializeBlockContent(data)
      onSave(locale, json)
    }, 400) // 400ms debounce
  }, [onSave])

  const handleChange = useCallback((locale: 'ru' | 'uk', newContent: Record<string, unknown>) => {
    if (locale === 'ru') setLocalRu(newContent)
    else setLocalUk(newContent)
    scheduleSave(locale, newContent)
  }, [scheduleSave])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  if (!def) {
    // Fallback: raw JSON textarea for unknown block types
    return <RawJsonEditor content={content} onSave={onSave} sectionKey={sectionKey} isPending={isPending} />
  }

  return (
    <div className="space-y-4">
      {/* Block header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{def.icon}</span>
          <span className="text-sm font-medium text-zinc-200">{def.label}</span>
          <span className="text-xs text-zinc-500">key: {sectionKey}</span>
        </div>

        {/* Preview toggle */}
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
            showPreview
              ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border border-transparent'
          }`}
        >
          <span className="text-xs">👁</span>
          {showPreview ? 'Скрыть превью' : 'Превью'}
        </button>
      </div>

      {/* Layout: editor + preview (side by side when preview is shown) */}
      <div className={`${showPreview ? 'grid grid-cols-2 gap-4' : 'space-y-4'}`}>
        {/* Editor column */}
        <div className={showPreview ? 'space-y-4' : 'space-y-4'}>
          {/* RU editor */}
          <div className="rounded-lg border border-amber-500/20 bg-zinc-900/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold uppercase text-amber-400">🇷🇺 Русский</span>
              {showPreview && (
                <button
                  type="button"
                  onClick={() => setPreviewLocale('ru')}
                  className={`ml-auto rounded px-2 py-0.5 text-[10px] font-medium ${
                    previewLocale === 'ru' ? 'bg-amber-600/20 text-amber-400' : 'text-zinc-600'
                  }`}
                >
                  превью
                </button>
              )}
            </div>
            <EditorSlot
              editor={def.editor}
              fields={def.fields}
              content={localRu}
              onChange={(newContent) => handleChange('ru', newContent)}
              locale="ru"
            />
          </div>

          {/* UK editor */}
          <div className="rounded-lg border border-blue-500/20 bg-zinc-900/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold uppercase text-blue-400">🇺🇦 Українська</span>
              {showPreview && (
                <button
                  type="button"
                  onClick={() => setPreviewLocale('uk')}
                  className={`ml-auto rounded px-2 py-0.5 text-[10px] font-medium ${
                    previewLocale === 'uk' ? 'bg-blue-600/20 text-blue-400' : 'text-zinc-600'
                  }`}
                >
                  превью
                </button>
              )}
            </div>
            <EditorSlot
              editor={def.editor}
              fields={def.fields}
              content={localUk}
              onChange={(newContent) => handleChange('uk', newContent)}
              locale="uk"
            />
          </div>
        </div>

        {/* Preview column */}
        {showPreview && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase text-indigo-400">👁 Предпросмотр</span>
              <span className="text-[10px] text-zinc-500">
                {previewLocale === 'ru' ? '🇷🇺 RU' : '🇺🇦 UK'}
              </span>
            </div>
            <div className="sticky top-4">
              <div className="rounded-lg border border-zinc-700/50 overflow-hidden">
                <BlockPreview
                  sectionType={sectionType}
                  content={previewLocale === 'ru' ? localRu : localUk}
                  locale={previewLocale}
                />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewLocale('ru')}
                  className={`rounded px-2 py-1 text-xs transition-colors ${
                    previewLocale === 'ru' ? 'bg-amber-600/20 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  🇷🇺 RU
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewLocale('uk')}
                  className={`rounded px-2 py-1 text-xs transition-colors ${
                    previewLocale === 'uk' ? 'bg-blue-600/20 text-blue-400' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  🇺🇦 UK
                </button>
                <div className="flex-1" />
                <span className="text-[10px] text-zinc-600">
                  авто-обновление
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * EditorSlot — stable component that picks between dedicated editor and DynamicBlockEditor.
 */
function EditorSlot({
  editor,
  fields,
  content,
  onChange,
  locale,
}: {
  editor?: React.ComponentType<{ content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void; locale: 'ru' | 'uk' }>
  fields: FieldDefinition[]
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
  locale: 'ru' | 'uk'
}) {
  if (editor) {
    const Editor = editor
    return <Editor content={content} onChange={onChange} locale={locale} />
  }
  return <DynamicBlockEditor content={content} onChange={onChange} locale={locale} fields={fields} />
}

/* ── Fallback: raw JSON textarea for unknown types ── */

function RawJsonEditor({ content, onSave, sectionKey, isPending }: {
  content: BlockContent
  onSave: (locale: 'ru' | 'uk', contentJson: string) => void
  sectionKey: string
  isPending?: boolean
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-zinc-200">⚠️ Неизвестный тип блока</span>
        <span className="text-xs text-zinc-500">key: {sectionKey}</span>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">RU content (JSON)</label>
        <textarea
          defaultValue={JSON.stringify(content.ru, null, 2)}
          onChange={(e) => onSave('ru', e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">UK content (JSON)</label>
        <textarea
          defaultValue={JSON.stringify(content.uk, null, 2)}
          onChange={(e) => onSave('uk', e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
        />
      </div>
    </div>
  )
}
