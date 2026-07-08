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
    <div className={`rounded-lg border p-4 ${section.section.enabled ? 'border-gray-200 bg-white' : 'border-dashed border-gray-300 bg-gray-50'}`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggle}
            disabled={isPending}
            className={`rounded px-2 py-0.5 text-xs font-medium ${
              section.section.enabled
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {section.section.enabled ? 'Вкл' : 'Выкл'}
          </button>
          <span className="text-sm font-medium text-gray-900">
            {SECTION_TYPE_LABELS[section.section.type] ?? section.section.type}
          </span>
          <span className="text-xs text-gray-400">key: {section.section.key}</span>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
        >
          Удалить
        </button>
      </div>

      {/* Content editor */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">RU content</label>
          <textarea
            defaultValue={ru?.contentJson ?? ''}
            onChange={(e) => handleContentChange('ru', e.target.value)}
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs font-mono shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder='{"key": "value"}'
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">UK content</label>
          <textarea
            defaultValue={uk?.contentJson ?? ''}
            onChange={(e) => handleContentChange('uk', e.target.value)}
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs font-mono shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
      <h2 className="text-lg font-semibold text-gray-900">Секции страницы</h2>

      {sections.length === 0 && (
        <p className="text-sm text-gray-500">Секции не добавлены</p>
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
      <form action={handleAddSection} className="flex items-end gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Тип секции</label>
          <select
            name="type"
            required
            className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {Object.entries(SECTION_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Ключ (уникальный)</label>
          <input
            name="key"
            required
            placeholder="main-hero"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <input type="hidden" name="settings_json" value="{}" />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          + Добавить
        </button>
      </form>
    </div>
  )
}
