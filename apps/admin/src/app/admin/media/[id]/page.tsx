/* eslint-disable @next/next/no-img-element */

import { getDB } from '@/db'
import { mediaAssets } from '@/db/schema/media'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { MediaEditForm } from './form'
import { deleteMedia } from '@/lib/actions/media'

interface Props {
  params: Promise<{ id: string }>
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

function formatSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Префікс публічного сайту — адмінка не має R2 біндінгу,
 * тому завантажуємо медіа через головний сайт (podvarchan.com).
 * Аналогічно resolveCoverImageUrl() у blog/posts/[id]/page.tsx.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://podvarchan.com'

function mediaUrl(publicUrl: string | null): string {
  if (!publicUrl) return ''
  return publicUrl.startsWith('/') ? `${SITE_URL}${publicUrl}` : publicUrl
}

export default async function MediaEditPage(props: Props) {
  const { id } = await props.params
  const db = getDB()

  const [asset] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1)
  if (!asset) notFound()

  const isImage = asset.mimeType?.startsWith('image/') && asset.mimeType !== 'image/svg+xml'

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {asset.originalName || 'Медіа'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {asset.mimeType && (mimeIcons[asset.mimeType] || '📁')} {asset.mimeType} · {formatSize(asset.size)}
          {asset.width && asset.height && ` · ${asset.width}×${asset.height}`}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Preview */}
        <div>
          <div className="overflow-hidden rounded-lg border bg-white">
            {isImage ? (
              <img
                src={mediaUrl(asset.publicUrl)}
                alt={asset.originalName || ''}
                className="w-full object-contain"
                style={{ maxHeight: '60vh' }}
              />
            ) : (
              <div className="flex items-center justify-center py-20 text-6xl text-gray-300">
                {asset.mimeType ? (mimeIcons[asset.mimeType] || '📁') : '📁'}
              </div>
            )}
          </div>
        </div>

        {/* Edit Form */}
        <div>
          <MediaEditForm
            asset={{
              id: asset.id,
              altRu: asset.altRu || '',
              altUk: asset.altUk || '',
              titleRu: asset.titleRu || '',
              titleUk: asset.titleUk || '',
              captionRu: asset.captionRu || '',
              captionUk: asset.captionUk || '',
            }}
            onDelete={deleteMedia}
          />
        </div>
      </div>
    </div>
  )
}
