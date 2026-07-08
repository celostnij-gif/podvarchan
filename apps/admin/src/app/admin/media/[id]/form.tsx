'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface AssetMeta {
  id: string
  altRu: string
  altUk: string
  titleRu: string
  titleUk: string
  captionRu: string
  captionUk: string
}

interface Props {
  asset: AssetMeta
  onDelete: (id: string) => Promise<void>
}

export function MediaEditForm({ asset, onDelete }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    startTransition(async () => {
      const { updateMediaMeta } = await import('@/lib/actions/media')
      await updateMediaMeta(asset.id, formData)
      router.refresh()
    })
  }

  async function handleDelete() {
    if (!confirm('Видалити цей файл? Цю дію не можна скасувати.')) return
    startTransition(async () => {
      await onDelete(asset.id)
      router.push('/admin/media')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Alt text */}
      <fieldset className="rounded-lg border p-4">
        <legend className="text-sm font-medium text-gray-700">Alt текст (для SEO)</legend>
        <div className="mt-2 space-y-2">
          <div>
            <label className="block text-xs text-gray-500">RU</label>
            <input
              name="altRu"
              defaultValue={asset.altRu}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500">UK</label>
            <input
              name="altUk"
              defaultValue={asset.altUk}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </fieldset>

      {/* Title */}
      <fieldset className="rounded-lg border p-4">
        <legend className="text-sm font-medium text-gray-700">Title (підказка)</legend>
        <div className="mt-2 space-y-2">
          <div>
            <label className="block text-xs text-gray-500">RU</label>
            <input
              name="titleRu"
              defaultValue={asset.titleRu}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500">UK</label>
            <input
              name="titleUk"
              defaultValue={asset.titleUk}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </fieldset>

      {/* Caption */}
      <fieldset className="rounded-lg border p-4">
        <legend className="text-sm font-medium text-gray-700">Підпис</legend>
        <div className="mt-2 space-y-2">
          <div>
            <label className="block text-xs text-gray-500">RU</label>
            <textarea
              name="captionRu"
              defaultValue={asset.captionRu}
              rows={2}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500">UK</label>
            <textarea
              name="captionUk"
              defaultValue={asset.captionUk}
              rows={2}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </fieldset>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? 'Збереження...' : 'Зберегти'}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
        >
          Видалити
        </button>
      </div>
    </form>
  )
}
