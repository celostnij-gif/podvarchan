'use client'

import { useActionState } from 'react'
import { saveSeoOverride } from '@/lib/actions/seo'
import { useRouter } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'

interface EditFormProps {
  entityType: string
  entityId: string
  locale: string
  defaults: {
    title: string
    description: string
    keywords: string
    canonicalPath: string
    ogTitle: string
    ogDescription: string
  }
}

export function SeoEditForm({ entityType, entityId, locale, defaults }: EditFormProps) {
  const router = useRouter()

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      try {
        await saveSeoOverride(formData)
        router.refresh()
        return null
      } catch (err) {
        if (isRedirectError(err)) throw err
        return { error: err instanceof Error ? err.message : 'Невідома помилка' }
      }
    },
    null,
  )

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="entityType" value={entityType} />
      <input type="hidden" name="entityId" value={entityId} />
      <input type="hidden" name="locale" value={locale} />

      {state?.error && (
        <div className="rounded-lg border border-red-900/50 bg-red-900/20 p-3 text-sm text-red-400">{state.error}</div>
      )}

      <div>
        <label htmlFor="seo-title" className="block text-sm font-medium text-zinc-300">Заголовок</label>
        <input
          id="seo-title"
          name="title"
          defaultValue={defaults.title}
          maxLength={60}
          className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 shadow-sm focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
        />
        <p className="mt-0.5 text-xs text-zinc-500">Рекомендовано: 30-60 символів. Зараз: {defaults.title.length}</p>
      </div>

      <div>
        <label htmlFor="seo-description" className="block text-sm font-medium text-zinc-300">Мета-опис</label>
        <textarea
          id="seo-description"
          name="description"
          defaultValue={defaults.description}
          maxLength={200}
          rows={3}
          className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 shadow-sm focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
        />
        <p className="mt-0.5 text-xs text-zinc-500">Рекомендовано: 70-160 символів. Зараз: {defaults.description.length}</p>
      </div>

      <div>
        <label htmlFor="seo-keywords" className="block text-sm font-medium text-zinc-300">Ключові слова (через кому)</label>
        <input
          id="seo-keywords"
          name="keywords"
          defaultValue={defaults.keywords}
          className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 shadow-sm focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
        />
      </div>

      <div>
        <label htmlFor="seo-canonical" className="block text-sm font-medium text-zinc-300">Канонічний шлях</label>
        <input
          id="seo-canonical"
          name="canonicalPath"
          defaultValue={defaults.canonicalPath}
          placeholder="/ru/uslugi/gipnoterapiya-onlayn/"
          className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 shadow-sm focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="seo-ogTitle" className="block text-sm font-medium text-zinc-300">OG Заголовок</label>
          <input
            id="seo-ogTitle"
            name="ogTitle"
            defaultValue={defaults.ogTitle}
            className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 shadow-sm focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>
        <div>
          <label htmlFor="seo-ogDescription" className="block text-sm font-medium text-zinc-300">OG Опис</label>
          <input
            id="seo-ogDescription"
            name="ogDescription"
            defaultValue={defaults.ogDescription}
            className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 shadow-sm focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-amber-600 px-6 py-2 text-sm font-medium text-white hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isPending ? 'Збереження...' : 'Зберегти SEO'}
        </button>
      </div>
    </form>
  )
}
