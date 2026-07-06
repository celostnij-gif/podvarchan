/* eslint-disable @next/next/no-img-element */

import { getDB } from '@/db'
import { mediaAssets } from '@/db/schema/media'
import { desc, like, or } from 'drizzle-orm'
import Link from 'next/link'

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

  const conditions = []
  if (params.q) {
    const q = `%${params.q}%`
    conditions.push(
      or(
        like(mediaAssets.originalName, q),
        like(mediaAssets.fileName, q),
      )
    )
  }

  const rows = await db
    .select()
    .from(mediaAssets)
    .orderBy(desc(mediaAssets.createdAt))
    .all()

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Медіатека</h1>
        <span className="text-sm text-gray-500">
          Всього: {rows.length}
        </span>
      </div>

      {/* Search */}
      <div className="mb-4">
        <form className="flex items-center gap-3" method="GET">
          <input
            name="q"
            type="search"
            defaultValue={params.q ?? ''}
            placeholder="Пошук за назвою..."
            className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
          >
            Пошук
          </button>
          {params.q && (
            <Link
              href="/admin/media"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              × Скинути
            </Link>
          )}
        </form>
      </div>

      {/* Grid */}
      {rows.length === 0 ? (
        <div className="rounded-lg border bg-white py-12 text-center text-sm text-gray-500">
          {params.q ? 'Нічого не знайдено.' : 'Медіатека порожня. Завантажте файли через API.'}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {rows.map((asset) => (
            <Link
              key={asset.id}
              href={`/admin/media/${asset.id}`}
              className="group rounded-lg border bg-white p-2 transition-shadow hover:shadow-md"
            >
              <div className="mb-2 flex aspect-square items-center justify-center overflow-hidden rounded-md bg-gray-50">
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
              <div className="truncate text-xs text-gray-700" title={asset.originalName || ''}>
                {asset.originalName || '—'}
              </div>
              <div className="text-xs text-gray-400">
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
