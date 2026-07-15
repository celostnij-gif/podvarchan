'use client'

import { useTransition } from 'react'
import { addSection, deleteSection, toggleSection, updateSectionContent } from '@/lib/actions/pages'
import type { PageSectionWithTranslations } from '../types'

interface SectionEditorProps {
  pageId: string
  sections: PageSectionWithTranslations[]
}

const SECTION_TYPE_LABELS: Record<string, string> = {
  hero: 'Герой',
  'text-block': 'Текстовый блок',
  'image-text': 'Изображение + текст',
  stats: 'Статистика',
  timeline: 'Таймлайн',
  gallery: 'Галерея',
  'video-embed': 'Видео',
  'services-grid': 'Сетка услуг',
  'faq-group-ref': 'FAQ группа',
  'testimonials-ref': 'Отзывы',
  cta: 'CTA',
  'contact-form': 'Форма контактов',
}

function SectionEditorItem({ section, pageId, onRefresh }: {
  section: PageSectionWithTranslations
  pageId: string
  onRefresh: () => void
}) {
  const [isPending, startTransition] = useTransition()

  const ru = section.translations.find((t) => t.locale === 'ru')
  const uk = section.translations.find((t) => t.locale === 'uk')

  const handleContentChange = (locale: string, value: string) => {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('locale', locale)
      fd.set('content_json', value)
      fd.set('page_id', pageId)
      try {
        await updateSectionContent(section.section.id, fd)
      } catch {
        // ignore
      }
    })
  }

  const handleDelete = () => {
    if (!confirm('Удалить секцию?')) return
    startTransition(async () => {
      try {
        await deleteSection(section.section.id)
        onRefresh()
      } catch {
        // ignore
      }
    })
  }

  const handleToggle = () => {
    startTransition(async () => {
      try {
        await toggleSection(section.section.id, !section.section.enabled)
        onRefresh()
      } catch {
        // ignore
      }
    })
  }

  return (
    <div className={`rounded-lg border p-4 ${section.section.enabled ? 'border-zinc-700/50 bg-zinc-900/40' : 'border-dashed border-zinc-700/30 bg-zinc-900/20'}`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggle}
            disabled={isPending}
            className={`rounded px-2 py-0.5 text-xs font-medium ${
              section.section.enabled
                ? 'bg-green-900/30 text-green-400'
                : 'bg-zinc-800 text-zinc-500'
            }`}
          >
            {section.section.enabled ? 'Вкл' : 'Выкл'}
          </button>
          <span className="text-sm font-medium text-zinc-200">
            {SECTION_TYPE_LABELS[section.section.type] ?? section.section.type}
          </span>
          <span className="text-xs text-zinc-500">key: {section.section.key}</span>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
        >
          Удалить
        </button>
      </div>

      {/* Content editor */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">RU content</label>
          <textarea
            defaultValue={ru?.contentJson ?? ''}
            onChange={(e) => handleContentChange('ru', e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            placeholder='{"key": "value"}'
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">UK content</label>
          <textarea
            defaultValue={uk?.contentJson ?? ''}
            onChange={(e) => handleContentChange('uk', e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            placeholder='{"key": "value"}'
          />
        </div>
      </div>
    </div>
  )
}

export function SectionEditor({ pageId, sections }: SectionEditorProps) {
  const [isPending, startTransition] = useTransition()

  // Simple refresh by forcing a page reload
  const refresh = () => {
    window.location.reload()
  }

  const handleAddSection = (formData: FormData) => {
    startTransition(async () => {
      try {
        await addSection(pageId, formData)
        refresh()
      } catch (err) {
        alert(`Ошибка: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`)
      }
    })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-100">Секции страницы</h2>

      {sections.length === 0 && (
        <p className="text-sm text-zinc-500">Секции не добавлены</p>
      )}

      <div className="space-y-3">
        {sections.map((sec) => (
          <SectionEditorItem
            key={sec.section.id}
            section={sec}
            pageId={pageId}
            onRefresh={refresh}
          />
        ))}
      </div>

      {/* Add section form */}
      <form action={handleAddSection} className="flex items-end gap-3 rounded-lg border border-dashed border-zinc-700/50 bg-zinc-900/20 p-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Тип секции</label>
          <select
            name="type"
            required
            className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          >
            {Object.entries(SECTION_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Ключ (уникальный)</label>
          <input
            name="key"
            required
            placeholder="main-hero"
            className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>
        <input type="hidden" name="settings_json" value="{}" />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
        >
          + Добавить
        </button>
      </form>
    </div>
  )
}
