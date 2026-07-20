'use client'

import { createPage } from '@/lib/actions/pages'
import { useActionState } from 'react'
import Link from 'next/link'
import { isRedirectError } from 'next/dist/client/components/redirect-error'

export function PageForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      try {
        await createPage(formData)
        return null
      } catch (err) {
        if (isRedirectError(err)) throw err
        return { error: err instanceof Error ? err.message : 'Невідома помилка' }
      }
    },
    null,
  )

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      {state?.error && (
        <div className="rounded-lg border border-red-900/50 bg-red-900/20 p-3 text-sm text-red-400">{state.error}</div>
      )}

      <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/40 p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-100">Основні параметри</h2>

        <div className="mb-4">
          <label htmlFor="status" className="block text-sm font-medium text-zinc-300 mb-1">Статус</label>
          <select
            id="status"
            name="status"
            defaultValue="DRAFT"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          >
            <option value="DRAFT">Чернетка</option>
            <option value="PUBLISHED">Опубліковано</option>
          </select>
        </div>
      </div>

      {/* Russian */}
      <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/40 p-6">
        <h2 className="mb-4 text-lg font-semibold text-amber-400">🇷🇺 Російська</h2>
        <div className="mb-4">
          <label htmlFor="ru_slug" className="block text-sm font-medium text-zinc-300 mb-1">
            URL (slug) <span className="text-red-400">*</span>
          </label>
          <div className="flex items-center gap-1 text-sm text-zinc-500">
            <span>/ru/</span>
            <input
              id="ru_slug"
              name="ru_slug"
              required
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
              placeholder="my-page"
            />
          </div>
        </div>
        <div className="mb-4">
          <label htmlFor="ru_title" className="block text-sm font-medium text-zinc-300 mb-1">Заголовок</label>
          <input
            id="ru_title"
            name="ru_title"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            placeholder="Назва сторінки"
          />
        </div>
        <div>
          <label htmlFor="ru_excerpt" className="block text-sm font-medium text-zinc-300 mb-1">Короткий опис</label>
          <textarea
            id="ru_excerpt"
            name="ru_excerpt"
            rows={3}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>
      </div>

      {/* Ukrainian */}
      <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/40 p-6">
        <h2 className="mb-4 text-lg font-semibold text-amber-400">🇺🇦 Українська</h2>
        <div className="mb-4">
          <label htmlFor="uk_slug" className="block text-sm font-medium text-zinc-300 mb-1">
            URL (slug) <span className="text-red-400">*</span>
          </label>
          <div className="flex items-center gap-1 text-sm text-zinc-500">
            <span>/uk/</span>
            <input
              id="uk_slug"
              name="uk_slug"
              required
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
              placeholder="my-page"
            />
          </div>
        </div>
        <div className="mb-4">
          <label htmlFor="uk_title" className="block text-sm font-medium text-zinc-300 mb-1">Назва</label>
          <input
            id="uk_title"
            name="uk_title"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            placeholder="Назва сторінки"
          />
        </div>
        <div>
          <label htmlFor="uk_excerpt" className="block text-sm font-medium text-zinc-300 mb-1">Короткий опис</label>
          <textarea
            id="uk_excerpt"
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
          {isPending ? 'Створення...' : 'Створити сторінку'}
        </button>
        <Link
          href="/admin/pages"
          className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700"
        >
          Скасувати
        </Link>
      </div>
    </form>
  )
}
