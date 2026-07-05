'use client'

import { updatePageMeta, deletePage } from '@/app/admin/actions/pages'
import { useTransition } from 'react'
import Link from 'next/link'
import { SectionEditor } from './section-editor'
import type { PageTranslationRecord, PageSectionWithTranslations } from '../types'

interface EditFormProps {
  page: {
    id: string
    status: string
    slugPattern: string | null
  }
  translations: PageTranslationRecord[]
  sections: PageSectionWithTranslations[]
}

export function EditPageForm({ page, translations, sections }: EditFormProps) {
  const [isPending, startTransition] = useTransition()

  const ru = translations.find((t) => t.locale === 'ru')
  const uk = translations.find((t) => t.locale === 'uk')

  async function handleSave(formData: FormData) {
    startTransition(async () => {
      try {
        await updatePageMeta(page.id, formData)
      } catch (err) {
        alert(`Ошибка: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`)
      }
    })
  }

  async function handleDelete() {
    if (!confirm('Удалить страницу навсегда?')) return
    startTransition(async () => {
      try {
        await deletePage(page.id)
      } catch (err) {
        alert(`Ошибка: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Meta form */}
      <form action={handleSave} className="max-w-2xl space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Основное</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
            <select
              name="status"
              defaultValue={page.status}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="DRAFT">Черновик</option>
              <option value="PUBLISHED">Опубликовано</option>
              <option value="ARCHIVED">Архив</option>
            </select>
          </div>
        </div>

        {/* Russian */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Русский</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">URL (slug)</label>
            <div className="flex items-center gap-1 text-sm text-gray-400">
              <span>/ru/</span>
              <input
                name="ru_slug"
                defaultValue={ru?.slug ?? ''}
                required
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Заголовок</label>
            <input
              name="ru_title"
              defaultValue={ru?.title ?? ''}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Краткое описание</label>
            <textarea
              name="ru_excerpt"
              defaultValue={ru?.excerpt ?? ''}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Ukrainian */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Украинский</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">URL (slug)</label>
            <div className="flex items-center gap-1 text-sm text-gray-400">
              <span>/uk/</span>
              <input
                name="uk_slug"
                defaultValue={uk?.slug ?? ''}
                required
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Заголовок</label>
            <input
              name="uk_title"
              defaultValue={uk?.title ?? ''}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Краткое описание</label>
            <textarea
              name="uk_excerpt"
              defaultValue={uk?.excerpt ?? ''}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isPending ? 'Сохранение...' : 'Сохранить'}
            </button>
        <Link
          href="/admin/pages"
          className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          Назад
        </Link>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-md bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
          >
            Удалить
          </button>
        </div>
      </form>

      <SectionEditor pageId={page.id} sections={sections} />
    </div>
  )
}

