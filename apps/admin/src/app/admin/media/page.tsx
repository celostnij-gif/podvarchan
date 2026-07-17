/* eslint-disable @next/next/no-img-element */
'use client'

import { useState, useCallback, useEffect } from 'react'
import { Trash2, Search, X, Upload } from 'lucide-react'
import Link from 'next/link'
import { deleteMediaBatch } from '@/lib/actions/media'
import { UploadZone } from '@/components/admin/media/UploadZone'

interface MediaAsset {
  id: string
  fileName: string | null
  originalName: string | null
  mimeType: string | null
  size: number | null
  width: number | null
  height: number | null
  publicUrl: string | null
  createdAt: string | null
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://podvarchan.com'

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

function mediaUrl(publicUrl: string | null): string {
  if (!publicUrl) return ''
  return publicUrl.startsWith('/') ? `${SITE_URL}${publicUrl}` : publicUrl
}

export default function MediaListPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [deletingSingle, setDeletingSingle] = useState<string | null>(null)

  const fetchAssets = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const url = q ? `/api/admin/media/list?q=${encodeURIComponent(q)}` : '/api/admin/media/list'
      const res = await fetch(url)
      const data = await res.json()
      setAssets(data.assets ?? [])
    } catch {
      setAssets([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAssets(searchQuery)
  }, [fetchAssets, searchQuery])

  // Debounce search
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Refresh list when window regains focus after uploads
  useEffect(() => {
    const onFocus = () => {
      if (assets.length > 0) fetchAssets(searchQuery)
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [fetchAssets, searchQuery, assets.length])

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === assets.length && assets.length > 0) {
      setSelected(new Set())
    } else {
      setSelected(new Set(assets.map((a) => a.id)))
    }
  }

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return
    if (!confirm(`Удалить ${selected.size} ${selected.size === 1 ? 'файл' : 'файлов'}?`)) return
    setDeleting(true)
    try {
      await deleteMediaBatch(Array.from(selected))
      setSelected(new Set())
      await fetchAssets(searchQuery)
    } catch {
      alert('Ошибка при удалении')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteSingle = async (id: string) => {
    if (!confirm('Удалить этот файл?')) return
    setDeletingSingle(id)
    try {
      // Use batch delete (no redirect) instead of `deleteMedia` which redirects
      await deleteMediaBatch([id])
      setSelected((prev) => { const n = new Set(prev); n.delete(id); return n })
      await fetchAssets(searchQuery)
    } catch {
      alert('Ошибка при удалении')
    } finally {
      setDeletingSingle(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-100">Медиатека</h1>
        <div className="flex items-center gap-3">
          {selected.size > 0 && (
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={deleting}
              className="flex items-center gap-1.5 rounded-lg bg-red-600/20 px-3 py-2 text-xs font-medium text-red-400 border border-red-600/30 hover:bg-red-600/30 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? '...' : `Удалить ${selected.size}`}
            </button>
          )}
          <span className="text-sm text-zinc-500">
            {assets.length} {assets.length === 1 ? 'файл' : 'файлов'}
          </span>
        </div>
      </div>

      {/* Upload zone */}
      <UploadZone />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Поиск по названию..."
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 pl-10 pr-10 py-2 text-sm text-zinc-200 placeholder-zinc-500
                     focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => { setSearchInput(''); setSearchQuery('') }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Toolbar */}
      {assets.length > 0 && (
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
          <label className="flex items-center gap-2 text-xs text-zinc-500 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.size === assets.length && assets.length > 0}
              onChange={toggleSelectAll}
              className="rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500"
            />
            {selected.size > 0
              ? `Выбрано ${selected.size}`
              : 'Выбрать все'}
          </label>
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchInput(''); setSearchQuery('') }}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              × Сбросить поиск
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="text-sm text-zinc-500">Загрузка...</span>
        </div>
      ) : assets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 py-16 text-center">
          <Upload className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-sm text-zinc-500">
            {searchQuery
              ? 'Ничего не найдено. Попробуйте другой запрос.'
              : 'Медиатека пуста. Перетащите файлы в зону загрузки выше.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {assets.map((asset) => {
            const isImage = asset.mimeType?.startsWith('image/') && asset.mimeType !== 'image/svg+xml'
            const isSelected = selected.has(asset.id)
            return (
              <div
                key={asset.id}
                className={`group relative rounded-xl border transition-all ${
                  isSelected
                    ? 'border-amber-500/50 bg-amber-900/10 ring-1 ring-amber-500/30'
                    : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-800/60 hover:shadow-lg'
                }`}
              >
                {/* Checkbox overlay */}
                <div
                  className={`absolute left-2 top-2 z-10 transition-opacity ${
                    isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(asset.id)}
                    className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Delete single (visible on hover) */}
                <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  {deletingSingle === asset.id ? (
                    <span className="text-xs text-red-400">...</span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); handleDeleteSingle(asset.id) }}
                      className="rounded-md bg-black/50 p-1 text-zinc-400 hover:text-red-400 hover:bg-black/70 transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Image/icon */}
                <Link
                  href={`/admin/media/${asset.id}`}
                  className="block p-2"
                >
                  <div className="mb-2 flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-zinc-800/80">
                    {isImage ? (
                      <img
                        src={mediaUrl(asset.publicUrl)}
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
                  <div className="px-0.5 truncate text-xs text-zinc-300" title={asset.originalName || ''}>
                    {asset.originalName || '—'}
                  </div>
                  <div className="px-0.5 text-xs text-zinc-500">
                    {asset.size ? formatSize(asset.size) : '—'}
                    {asset.mimeType && ` · ${asset.mimeType.split('/').pop()}`}
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
