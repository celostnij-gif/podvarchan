'use client'

import { useTransition } from 'react'
import { saveSeoOverride } from '@/app/admin/actions/seo'
import { useRouter } from 'next/navigation'

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
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      await saveSeoOverride(formData)
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="entityType" value={entityType} />
      <input type="hidden" name="entityId" value={entityId} />
      <input type="hidden" name="locale" value={locale} />

      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          name="title"
          defaultValue={defaults.title}
          maxLength={60}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-0.5 text-xs text-gray-400">Recommended: 30-60 characters. Current: {defaults.title.length}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Meta Description</label>
        <textarea
          name="description"
          defaultValue={defaults.description}
          maxLength={200}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-0.5 text-xs text-gray-400">Recommended: 70-160 characters. Current: {defaults.description.length}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Keywords (comma-separated)</label>
        <input
          name="keywords"
          defaultValue={defaults.keywords}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Canonical Path</label>
        <input
          name="canonicalPath"
          defaultValue={defaults.canonicalPath}
          placeholder="/ru/uslugi/gipnoterapiya-onlayn/"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">OG Title</label>
          <input
            name="ogTitle"
            defaultValue={defaults.ogTitle}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">OG Description</label>
          <input
            name="ogDescription"
            defaultValue={defaults.ogDescription}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save SEO Override'}
        </button>
      </div>
    </form>
  )
}
