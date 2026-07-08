/* eslint-disable @next/next/no-img-element */

import { getDB } from '@/db'
import { mediaAssets } from '@/db/schema/media'
import { desc, like, or } from 'drizzle-orm'
import Link from 'next/link'
import { UploadZone } from '@/components/admin/media/UploadZone'

interface Props {
  searchParams: Promise<{ q?: string }>
}

const mimeIcons: Record<string, string> = {
  'image/jpeg': '🖼️',
  'image/png': '🖼️',
  'image/webp': '🖼️',
  'image/avif': '🖼️',
  'image/gif': '🖼️',
  'image/svg+xml': '📐',
  'application/pdf': '📄',
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default async function MediaListPage(props: Props) {
  const params = await props.searchParams
  const db = getDB()

  const baseQuery = db.select().from(mediaAssets)

  const filtered = params.q
    ? await baseQuery
        .where(
          or(
            like(mediaAssets.originalName, `%${params.q}%`),
            like(mediaAssets.fileName, `%${params.q}%`),
          )
        )
        .orderBy(desc(mediaAssets.createdAt))
        .all()
    : await baseQuery.orderBy(desc(mediaAssets.createdAt)).all()

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-100">Медіатека</h1>
        <span className="text-sm text-gray-400">
          Всього: {filtered.length}
        </span>
      </div>

      {/* Upload zone */}
      <div className="mb-8">
        <UploadZone />
      </div>

      {/* Search */}
      <div className="mb-4">
        <form className="flex items-center gap-3" method="GET">
          <input
            name="q"
            type="search"
            defaultValue={params.q ?? ''}
            placeholder="Пошук за назвою..."
            className="w-64 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
          <button
            type="submit"
            className="rounded-lg bg-zinc-700 px-4 py-2 text-sm text-gray-200 hover:bg-zinc-600"
          >
            Пошук
          </button>
          {params.q && (
            <Link
              href="/admin/media"
              className="text-sm text-gray-400 hover:text-gray-200"
            >
              × Скинути
            </Link>
          )}
        </form>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 py-16 text-center">
          <p className="text-sm text-gray-500">
            {params.q
              ? 'Нічого не знайдено.'
              : 'Медіатека порожня. Перетягніть файли в зону вище, щоб завантажити.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((asset) => (
            <Link
              key={asset.id}
              href={`/admin/media/${asset.id}`}
              className="group rounded-xl border border-zinc-800 bg-zinc-900/60 p-2 transition-all hover:border-zinc-700 hover:bg-zinc-800/60 hover:shadow-lg"
            >
              <div className="mb-2 flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-zinc-800/80">
                {asset.mimeType?.startsWith('image/') && asset.mimeType !== 'image/svg+xml' ? (
                  <img
                    src={asset.publicUrl || ''}
                    alt={asset.originalName || ''}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-3xl">
                    {asset.mimeType ? (mimeIcons[asset.mimeType] || '📁') : '📁'}
                  </span>
                )}
              </div>
              <div className="truncate px-0.5 text-xs text-gray-300" title={asset.originalName || ''}>
                {asset.originalName || '—'}
              </div>
              <div className="px-0.5 text-xs text-gray-500">
                {asset.size ? formatSize(asset.size) : '—'}
                {asset.mimeType && ` · ${asset.mimeType.split('/').pop()}`}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
