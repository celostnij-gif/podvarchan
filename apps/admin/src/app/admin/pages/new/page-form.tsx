'use client'

import { createPage } from '@/lib/actions/pages'
import { useTransition } from 'react'
import Link from 'next/link'

export function PageForm() {
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await createPage(formData)
      } catch (err) {
        alert(`Ошибка: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`)
      }
    })
  }

  return (
    <form action={handleSubmit} className="max-w-2xl space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Основное</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
          <select
            name="status"
            defaultValue="DRAFT"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="DRAFT">Черновик</option>
            <option value="PUBLISHED">Опубликовать</option>
          </select>
        </div>
      </div>

      {/* Russian */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Русский</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL (slug) <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-1 text-sm text-gray-400">
            <span>/ru/</span>
            <input
              name="ru_slug"
              required
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="my-page"
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Заголовок</label>
          <input
            name="ru_title"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Название страницы"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Краткое описание</label>
          <textarea
            name="ru_excerpt"
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Ukrainian */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Украинский</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL (slug) <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-1 text-sm text-gray-400">
            <span>/uk/</span>
            <input
              name="uk_slug"
              required
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="my-page"
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Заголовок</label>
          <input
            name="uk_title"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Назва сторінки"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Краткое описание</label>
          <textarea
            name="uk_excerpt"
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isPending ? 'Создание...' : 'Создать страницу'}
        </button>
        <Link
          href="/admin/pages"
          className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          Отмена
        </Link>
      </div>
    </form>
  )
}
