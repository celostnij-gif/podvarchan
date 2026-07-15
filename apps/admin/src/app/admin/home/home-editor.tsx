'use client'

import { useTransition } from 'react'
import { updateHomeContent } from '@/lib/actions/pages'
import { SectionEditor } from '@/app/admin/pages/[id]/section-editor'
import type { PageTranslationRecord, PageSectionWithTranslations } from '@/app/admin/pages/types'

interface HomeEditorProps {
  pageId: string
  status: string
  tr: {
    ru: PageTranslationRecord | null
    uk: PageTranslationRecord | null
  }
  hero: {
    ru: { title: string; subtitle: string; cta: string }
    uk: { title: string; subtitle: string; cta: string }
  }
  sections: PageSectionWithTranslations[]
}

export function HomeEditor({ pageId, status, tr, hero, sections }: HomeEditorProps) {
  const [isPending, startTransition] = useTransition()

  async function handleSave(formData: FormData) {
    startTransition(async () => {
      try {
        await updateHomeContent(formData)
      } catch (err) {
        alert(`Ошибка: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`)
      }
    })
  }

  return (
    <form action={handleSave} className="max-w-3xl space-y-6">
      {/* Status */}
      <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/40 p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-100">Параметры</h2>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Статус</label>
          <select
            name="status"
            defaultValue={status}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          >
            <option value="DRAFT">Черновик</option>
            <option value="PUBLISHED">Опубликовано</option>
            <option value="ARCHIVED">Архив</option>
          </select>
        </div>
      </div>

      {/* Russian */}
      <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/40 p-6">
        <h2 className="mb-4 text-lg font-semibold text-amber-400">Русский</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-300 mb-1">URL (slug)</label>
          <div className="flex items-center gap-1 text-sm text-zinc-500">
            <span>/ru/</span>
            <input
              name="ru_slug"
              defaultValue={tr.ru?.slug ?? '/'}
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-300 mb-1">Заголовок (title)</label>
          <input
            name="ru_title"
            defaultValue={tr.ru?.title ?? ''}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-300 mb-1">Краткое описание (excerpt)</label>
          <textarea
            name="ru_excerpt"
            defaultValue={tr.ru?.excerpt ?? ''}
            rows={2}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>

        <h3 className="mb-3 text-sm font-semibold text-zinc-200 border-t border-zinc-700/50 pt-4">Hero-блок</h3>

        <div className="mb-3">
          <label className="block text-sm font-medium text-zinc-300 mb-1">Заголовок hero</label>
          <input
            name="ru_heroTitle"
            defaultValue={hero.ru.title}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-zinc-300 mb-1">Подзаголовок hero</label>
          <input
            name="ru_heroSubtitle"
            defaultValue={hero.ru.subtitle}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Текст кнопки hero (CTA)</label>
          <input
            name="ru_heroCta"
            defaultValue={hero.ru.cta}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>
      </div>

      {/* Ukrainian */}
      <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/40 p-6">
        <h2 className="mb-4 text-lg font-semibold text-amber-400">Украинский</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-300 mb-1">URL (slug)</label>
          <div className="flex items-center gap-1 text-sm text-zinc-500">
            <span>/uk/</span>
            <input
              name="uk_slug"
              defaultValue={tr.uk?.slug ?? '/'}
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-300 mb-1">Заголовок (title)</label>
          <input
            name="uk_title"
            defaultValue={tr.uk?.title ?? ''}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-300 mb-1">Краткое описание (excerpt)</label>
          <textarea
            name="uk_excerpt"
            defaultValue={tr.uk?.excerpt ?? ''}
            rows={2}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>

        <h3 className="mb-3 text-sm font-semibold text-zinc-200 border-t border-zinc-700/50 pt-4">Hero-блок</h3>

        <div className="mb-3">
          <label className="block text-sm font-medium text-zinc-300 mb-1">Заголовок hero</label>
          <input
            name="uk_heroTitle"
            defaultValue={hero.uk.title}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-zinc-300 mb-1">Подзаголовок hero</label>
          <input
            name="uk_heroSubtitle"
            defaultValue={hero.uk.subtitle}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Текст кнопки hero (CTA)</label>
          <input
            name="uk_heroCta"
            defaultValue={hero.uk.cta}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-amber-600 px-6 py-2 text-sm font-medium text-white hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isPending ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>

      {/* Sections */}
      <div className="border-t border-zinc-800/50 pt-6">
        <SectionEditor pageId={pageId} sections={sections} />
      </div>
    </form>
  )
}
