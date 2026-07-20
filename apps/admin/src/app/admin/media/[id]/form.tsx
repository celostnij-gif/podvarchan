'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'

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

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      try {
        const { updateMediaMeta } = await import('@/lib/actions/media')
        await updateMediaMeta(asset.id, formData)
        router.refresh()
        return null
      } catch (err) {
        if (isRedirectError(err)) throw err
        return { error: err instanceof Error ? err.message : 'Невідома помилка' }
      }
    },
    null,
  )

  async function handleDelete() {
    if (!confirm('Видалити цей файл? Цю дію не можна скасувати.')) return
    try {
      await onDelete(asset.id)
      router.push('/admin/media')
    } catch {
      // error handled by parent
    }
  }

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg border border-red-900/50 bg-red-900/20 p-3 text-sm text-red-400">{state.error}</div>
      )}

      {/* Alt text */}
      <fieldset className="rounded-lg border border-zinc-700/50 p-4">
        <legend className="text-sm font-medium text-zinc-300">Alt текст (для SEO)</legend>
        <div className="mt-2 space-y-2">
          <div>
            <label htmlFor="altRu" className="block text-xs text-zinc-500">RU</label>
            <input
              id="altRu"
              name="altRu"
              defaultValue={asset.altRu}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            />
          </div>
          <div>
            <label htmlFor="altUk" className="block text-xs text-zinc-500">UK</label>
            <input
              id="altUk"
              name="altUk"
              defaultValue={asset.altUk}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            />
          </div>
        </div>
      </fieldset>

      {/* Title */}
      <fieldset className="rounded-lg border border-zinc-700/50 p-4">
        <legend className="text-sm font-medium text-zinc-300">Заголовок (підказка)</legend>
        <div className="mt-2 space-y-2">
          <div>
            <label htmlFor="titleRu" className="block text-xs text-zinc-500">RU</label>
            <input
              id="titleRu"
              name="titleRu"
              defaultValue={asset.titleRu}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            />
          </div>
          <div>
            <label htmlFor="titleUk" className="block text-xs text-zinc-500">UK</label>
            <input
              id="titleUk"
              name="titleUk"
              defaultValue={asset.titleUk}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            />
          </div>
        </div>
      </fieldset>

      {/* Caption */}
      <fieldset className="rounded-lg border border-zinc-700/50 p-4">
        <legend className="text-sm font-medium text-zinc-300">Підпис</legend>
        <div className="mt-2 space-y-2">
          <div>
            <label htmlFor="captionRu" className="block text-xs text-zinc-500">RU</label>
            <textarea
              id="captionRu"
              name="captionRu"
              defaultValue={asset.captionRu}
              rows={2}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            />
          </div>
          <div>
            <label htmlFor="captionUk" className="block text-xs text-zinc-500">UK</label>
            <textarea
              id="captionUk"
              name="captionUk"
              defaultValue={asset.captionUk}
              rows={2}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            />
          </div>
        </div>
      </fieldset>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
        >
          {isPending ? 'Збереження...' : 'Зберегти'}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="rounded-lg bg-red-900/30 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-900/50 disabled:opacity-50"
        >
          Видалити
        </button>
      </div>
    </form>
  )
}
