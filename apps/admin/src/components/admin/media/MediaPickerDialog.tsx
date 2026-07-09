'use client'

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useRef } from 'react'
import { Search, X, Image as ImageIcon } from 'lucide-react'

interface MediaAsset {
  id: string
  fileName: string | null
  originalName: string | null
  mimeType: string | null
  publicUrl: string | null
  width: number | null
  height: number | null
  size: number | null
}

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (asset: MediaAsset) => void
}

function formatSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function MediaPickerDialog({ open, onClose, onSelect }: Props) {
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [query, setQuery] = useState('')
  const fetchKey = useRef(0)

  useEffect(() => {
    if (!open) return
    const key = ++fetchKey.current
    const url = query ? `/api/admin/media/list?q=${encodeURIComponent(query)}` : '/api/admin/media/list'
    fetch(url)
      .then(r => r.json())
      .then(data => { if (key === fetchKey.current) setAssets(data.assets ?? []) })
      .catch(() => { if (key === fetchKey.current) setAssets([]) })
  }, [open, query])

  if (!open) return null

  const images = assets.filter(a => a.mimeType?.startsWith('image/'))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="mx-4 w-full max-w-3xl rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-700 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-100">Виберіть зображення</h2>
          <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-zinc-700 hover:text-gray-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Пошук..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-10 pr-3 text-sm text-gray-200 placeholder-gray-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="max-h-80 overflow-y-auto px-5 pb-5">
          {assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-sm text-gray-500">
              <ImageIcon className="mb-3 h-10 w-10 text-gray-600" />
              {query ? 'Нічого не знайдено.' : 'Медіатека порожня. Завантажте файли в Медіатеці.'}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {images.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => onSelect(asset)}
                  className="group relative overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 transition-all hover:border-amber-500/50 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <div className="aspect-square overflow-hidden">
                    {asset.publicUrl ? (
                      <img
                        src={asset.publicUrl}
                        alt={asset.originalName || ''}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-500">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="truncate px-1.5 py-1 text-xs text-gray-400" title={asset.originalName || ''}>
                    {asset.originalName || asset.fileName || '—'}
                  </div>
                  {asset.width && asset.height && (
                    <div className="px-1.5 pb-1 text-[10px] text-gray-500">
                      {asset.width}×{asset.height} {asset.size ? `· ${formatSize(asset.size)}` : ''}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-zinc-700 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-gray-300 hover:bg-zinc-700"
          >
            Скасувати
          </button>
        </div>
      </div>
    </div>
  )
}
