'use client'

import { updatePageMeta, deletePage } from '@/lib/actions/pages'
import { useActionState, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SectionEditor } from './section-editor'
import { ConfirmDialog, useToast } from '@/components/admin'
import type { PageTranslationRecord, PageSectionWithTranslations } from '../types'

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
  const { showToast } = useToast()
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasUnsavedChanges])

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; saved?: boolean } | null, formData: FormData) => {
      try {
        await updatePageMeta(page.id, formData)
        showToast('success', 'Збережено')
        return { saved: true, redirectTo: '/admin/pages' }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Невідома помилка'
        showToast('error', msg)
        return { error: msg }
      }
    },
    null,
  )

  useEffect(() => { if (state?.saved) { router.push(state.redirectTo!) } }, [state?.saved, state?.redirectTo, router])
  function handleDelete() {
    setConfirmOpen(true)
  }

  async function handleConfirmDelete() {
    setConfirmOpen(false)
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
            onChange={() => setHasUnsavedChanges(true)}
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
              <input name="ru_slug" defaultValue={ru?.slug ?? ''} required
                onChange={() => setHasUnsavedChanges(true)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
            </div>
            <div>
              <input name="ru_title" defaultValue={ru?.title ?? ''}
                onChange={() => setHasUnsavedChanges(true)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
            </div>
            <div>
              <textarea name="ru_excerpt" defaultValue={ru?.excerpt ?? ''} rows={2}
                onChange={() => setHasUnsavedChanges(true)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
            </div>
          </div>
        </fieldset>

        {/* UK locale */}
        <fieldset className="rounded-lg border border-zinc-700/50 p-4">
          <legend className="text-sm font-semibold text-blue-400">🇺🇦 Українська</legend>
          <div className="space-y-4 mt-3">
            <div>
              <input name="uk_slug" defaultValue={uk?.slug ?? ''} required
                onChange={() => setHasUnsavedChanges(true)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
            </div>
            <div>
              <input name="uk_title" defaultValue={uk?.title ?? ''}
                onChange={() => setHasUnsavedChanges(true)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
            </div>
            <div>
              <textarea name="uk_excerpt" defaultValue={uk?.excerpt ?? ''} rows={2}
                onChange={() => setHasUnsavedChanges(true)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
            </div>
          </div>
        </fieldset>
      </form>

      <SectionEditor pageId={page.id} sections={sections} />

      <ConfirmDialog
        open={confirmOpen}
        title="Видалити сторінку"
        message="Видалити сторінку назавжди? Цю дію не можна скасувати."
        confirmLabel="Видалити"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
