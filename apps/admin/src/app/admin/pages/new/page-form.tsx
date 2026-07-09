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
      <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/40 p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-100">Основное</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-300 mb-1">Статус</label>
          <select
            name="status"
            defaultValue="DRAFT"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          >
            <option value="DRAFT">Черновик</option>
            <option value="PUBLISHED">Опубликовать</option>
          </select>
        </div>
      </div>

      {/* Russian */}
      <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/40 p-6">
        <h2 className="mb-4 text-lg font-semibold text-amber-400">Русский</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            URL (slug) <span className="text-red-400">*</span>
          </label>
          <div className="flex items-center gap-1 text-sm text-zinc-500">
            <span>/ru/</span>
            <input
              name="ru_slug"
              required
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
              placeholder="my-page"
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-300 mb-1">Заголовок</label>
          <input
            name="ru_title"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            placeholder="Название страницы"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Краткое описание</label>
          <textarea
            name="ru_excerpt"
            rows={3}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>
      </div>

      {/* Ukrainian */}
      <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/40 p-6">
        <h2 className="mb-4 text-lg font-semibold text-amber-400">Украинский</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            URL (slug) <span className="text-red-400">*</span>
          </label>
          <div className="flex items-center gap-1 text-sm text-zinc-500">
            <span>/uk/</span>
            <input
              name="uk_slug"
              required
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
              placeholder="my-page"
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-300 mb-1">Заголовок</label>
          <input
            name="uk_title"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            placeholder="Назва сторінки"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Краткое описание</label>
          <textarea
            name="uk_excerpt"
            rows={3}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-amber-600 px-6 py-2 text-sm font-medium text-white hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isPending ? 'Создание...' : 'Создать страницу'}
        </button>
        <Link
          href="/admin/pages"
          className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700"
        >
          Отмена
        </Link>
      </div>
    </form>
  )
}
