'use client'

import { getBlockDefinition, serializeBlockContent } from '@/lib/blocks/registry'
import type { BlockContent } from '@/lib/blocks/types'

interface BlockEditorPanelProps {
  sectionType: string
  sectionKey: string
  content: BlockContent
  onSave: (locale: 'ru' | 'uk', contentJson: string) => void
  isPending?: boolean
}

/**
 * Universal Block Editor Panel.
 *
 * Given a section type and its RU/UK content, renders the type-specific
 * editor component and handles serialization back to JSON string.
 */
export function BlockEditorPanel({ sectionType, sectionKey, content, onSave, isPending }: BlockEditorPanelProps) {
  const def = getBlockDefinition(sectionType)
  if (!def) {
    // Fallback: raw JSON textarea for unknown block types
    return <RawJsonEditor content={content} onSave={onSave} sectionKey={sectionKey} isPending={isPending} />
  }

  const Editor = def.editor

  const handleChange = (locale: 'ru' | 'uk', newContent: Record<string, unknown>) => {
    const json = serializeBlockContent(newContent)
    onSave(locale, json)
  }

  return (
    <div className="space-y-4">
      {/* Block header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{def.icon}</span>
        <span className="text-sm font-medium text-zinc-200">{def.label}</span>
        <span className="text-xs text-zinc-500">key: {sectionKey}</span>
      </div>

      {/* RU editor */}
      <div className="rounded-lg border border-amber-500/20 bg-zinc-900/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold uppercase text-amber-400">🇷🇺 Русский</span>
        </div>
        <Editor
          content={content.ru}
          onChange={(newContent) => handleChange('ru', newContent)}
          locale="ru"
        />
      </div>

      {/* UK editor */}
      <div className="rounded-lg border border-blue-500/20 bg-zinc-900/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold uppercase text-blue-400">🇺🇦 Українська</span>
        </div>
        <Editor
          content={content.uk}
          onChange={(newContent) => handleChange('uk', newContent)}
          locale="uk"
        />
      </div>
    </div>
  )
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
