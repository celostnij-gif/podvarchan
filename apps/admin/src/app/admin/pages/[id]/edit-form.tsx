'use client'

import { updatePageMeta, deletePage } from '@/lib/actions/pages'
import { useActionState } from 'react'
import Link from 'next/link'
import { SectionEditor } from './section-editor'
import type { PageTranslationRecord, PageSectionWithTranslations } from '../types'
import { isRedirectError } from 'next/dist/client/components/redirect-error'

interface EditFormProps {
  page: {
    id: string
    status: string
  }
  translations: PageTranslationRecord[]
  sections: PageSectionWithTranslations[]
}

export function EditPageForm({ page, translations, sections }: EditFormProps) {
  const ru = translations.find((t) => t.locale === 'ru')
  const uk = translations.find((t) => t.locale === 'uk')

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; saved?: boolean } | null, formData: FormData) => {
      try {
        await updatePageMeta(page.id, formData)
        return { saved: true }
      } catch (err) {
        if (isRedirectError(err)) throw err
        return { error: err instanceof Error ? err.message : 'Невідома помилка' }
      }
    },
    null,
  )

  async function handleDelete() {
    if (!confirm('Видалити сторінку назавжди?')) return
    try {
      await deletePage(page.id)
    } catch (err) {
      // error handled by page redirect
    }
  }

  return (
    <div className="space-y-6">
      {/* Meta form */}
      <form action={formAction} className="max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
          {state?.saved && !state?.error && (
            <span className="rounded-lg bg-green-900/30 text-green-400 px-3 py-1.5 text-sm border border-green-700/30 inline-flex items-center gap-1">
              ✓ Збережено
            </span>
          )}
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
          >
            {pending ? 'Збереження…' : 'Зберегти'}
          </button>
          <Link
            href="/admin/pages"
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800"
          >
            Назад
          </Link>
          <div className="flex-1" />
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="rounded-lg bg-red-900/30 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-900/50 disabled:opacity-50"
          >
            Видалити
          </button>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Статус</label>
          <select
            name="status"
            defaultValue={page.status}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          >
            <option value="DRAFT">Чернетка</option>
            <option value="PUBLISHED">Опубліковано</option>
            <option value="ARCHIVED">Архів</option>
          </select>
        </div>

        {/* RU locale */}
        <fieldset className="rounded-lg border border-zinc-700/50 p-4">
          <legend className="text-sm font-semibold text-amber-400">🇷🇺 Російська</legend>
          <div className="space-y-4 mt-3">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">URL (slug)</label>
              <input name="ru_slug" defaultValue={ru?.slug ?? ''} required
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Назва</label>
              <input name="ru_title" defaultValue={ru?.title ?? ''}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Опис (excerpt)</label>
              <textarea name="ru_excerpt" defaultValue={ru?.excerpt ?? ''} rows={2}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
            </div>
          </div>
        </fieldset>

        {/* UK locale */}
        <fieldset className="rounded-lg border border-zinc-700/50 p-4">
          <legend className="text-sm font-semibold text-blue-400">🇺🇦 Українська</legend>
          <div className="space-y-4 mt-3">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">URL (slug)</label>
              <input name="uk_slug" defaultValue={uk?.slug ?? ''} required
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Назва</label>
              <input name="uk_title" defaultValue={uk?.title ?? ''}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Опис (excerpt)</label>
              <textarea name="uk_excerpt" defaultValue={uk?.excerpt ?? ''} rows={2}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
            </div>
          </div>
        </fieldset>
      </form>

      <SectionEditor pageId={page.id} sections={sections} />
    </div>
  )
}
