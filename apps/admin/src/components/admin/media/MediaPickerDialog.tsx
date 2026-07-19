'use client'

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useRef } from 'react'
import { Search, X, Image as ImageIcon, Upload, Link, Loader2 } from 'lucide-react'

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

/**
 * SITE_URL — публічний origin, з якого віддається медіа (/api/media/...).
 * Адмінка МАЄ R2-біндінг (MEDIA_R2_BUCKET у wrangler.jsonc) і завантажує
 * медіа у власний R2 через /api/admin/media/upload (НЕ через головний сайт).
 * SITE_URL потрібен лише для побудови абсолютних preview-URL у <img>.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://podvarchan.com'

function mediaUrl(publicUrl: string | null): string {
  if (!publicUrl) return ''
  return publicUrl.startsWith('/') ? `${SITE_URL}${publicUrl}` : publicUrl
}

function formatSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
/** Convert image File to WEBP blob via Canvas (client-side). */
async function convertToWebp(file: File, quality = 0.85): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })

  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)
  URL.revokeObjectURL(img.src)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('WEBP conversion failed'))),
      'image/webp',
      quality,
    )
  })
}

type Tab = 'library' | 'upload' | 'url'

export function MediaPickerDialog({ open, onClose, onSelect }: Props) {
  const [tab, setTab] = useState<Tab>('library')
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [query, setQuery] = useState('')
  const fetchKey = useRef(0)

  // Upload tab state
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // URL tab state
  const [externalUrl, setExternalUrl] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)

  // Fetch assets when dialog opens
  useEffect(() => {
    if (!open) return
    const key = ++fetchKey.current
    const url = '/api/admin/media/list'
    fetch(url)
      .then(r => r.json())
      .then(data => { if (key === fetchKey.current) setAssets(data.assets ?? []) })
      .catch(() => { if (key === fetchKey.current) setAssets([]) })
  }, [open])

  useEffect(() => {
    if (!open || !query) return
    const key = ++fetchKey.current
    const url = `/api/admin/media/list?q=${encodeURIComponent(query)}`
    fetch(url)
      .then(r => r.json())
      .then(data => { if (key === fetchKey.current) setAssets(data.assets ?? []) })
      .catch(() => { if (key === fetchKey.current) setAssets([]) })
  }, [query, open])

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (uploadPreview && uploadPreview.startsWith('blob:')) URL.revokeObjectURL(uploadPreview)
    }
  }, [uploadPreview])

  if (!open) return null

  const images = assets.filter(a => a.mimeType?.startsWith('image/'))

  const handleFileSelect = (file: File | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setUploadError('Тільки зображення (JPEG, PNG, WEBP, AVIF, GIF)')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Максимум 10 MB')
      return
    }
    setUploadError(null)
    setUploadFile(file)
    setUploadPreview(URL.createObjectURL(file))
  }

  const handleUpload = async () => {
    if (!uploadFile) return
    setUploading(true)
    setUploadError(null)

    try {
      // 1) Convert to WEBP client-side
      const webpBlob = await convertToWebp(uploadFile)

      // 2) Upload via admin API
      const formData = new FormData()
      formData.append('file', webpBlob, uploadFile.name.replace(/\.[^.]+$/, '.webp'))

      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }

      const asset: MediaAsset = await res.json()

      // 3) Select the newly uploaded asset
      onSelect(asset)
      resetUpload()
      onClose()
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Помилка завантаження')
    } finally {
      setUploading(false)
    }
  }

  const resetUpload = () => {
    setUploadFile(null)
    if (uploadPreview?.startsWith('blob:')) URL.revokeObjectURL(uploadPreview)
    setUploadPreview(null)
    setUploadError(null)
  }

  const handleUrlInsert = () => {
    const url = externalUrl.trim()
    if (!url) {
      setUrlError('Введіть URL')
      return
    }
    // Basic URL validation
    try {
      new URL(url)
    } catch {
      setUrlError('Невірний формат URL')
      return
    }
    // Create a minimal asset-like object for the URL
    onSelect({ id: url, publicUrl: url, fileName: url, originalName: url, mimeType: null, width: null, height: null, size: null })
    setExternalUrl('')
    setUrlError(null)
    onClose()
  }

  const renderTabBar = () => (
    <div className="flex border-b border-zinc-700">
      <button
        type="button"
        onClick={() => setTab('library')}
        className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors ${
          tab === 'library' ? 'border-b-2 border-amber-500 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <ImageIcon className="h-3.5 w-3.5" />
        Медіатека
      </button>
      <button
        type="button"
        onClick={() => setTab('upload')}
        className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors ${
          tab === 'upload' ? 'border-b-2 border-amber-500 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <Upload className="h-3.5 w-3.5" />
        Завантажити
      </button>
      <button
        type="button"
        onClick={() => setTab('url')}
        className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors ${
          tab === 'url' ? 'border-b-2 border-amber-500 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <Link className="h-3.5 w-3.5" />
        URL
      </button>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="mx-4 w-full max-w-3xl rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-700 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-100">Зображення</h2>
          <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-zinc-700 hover:text-gray-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {renderTabBar()}

        {/* ══════════  Library tab  ══════════ */}
        {tab === 'library' && (
          <>
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
              {images.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-sm text-gray-500">
                  <ImageIcon className="mb-3 h-10 w-10 text-gray-600" />
                  {query ? 'Нічого не знайдено.' : 'Медіатека порожня. Завантажте файли на вкладці «Завантажити».'}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                  {images.map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => { onSelect(asset); onClose() }}
                      className="group relative overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 transition-all hover:border-amber-500/50 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    >
                      <div className="aspect-square overflow-hidden">
                        {asset.publicUrl ? (
                          <img
                            src={mediaUrl(asset.publicUrl)}
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
          </>
        )}

        {/* ══════════  Upload tab  ══════════ */}
        {tab === 'upload' && (
          <div className="px-5 py-4">
            {!uploadFile ? (
              /* Dropzone */
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleFileSelect(e.dataTransfer.files[0] ?? null) }}
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-600 py-12 transition-colors hover:border-amber-500/50 hover:bg-zinc-800/50"
              >
                <Upload className="mb-3 h-10 w-10 text-zinc-500" />
                <p className="text-sm text-zinc-400">Перетягніть зображення або натисніть щоб вибрати</p>
                <p className="mt-1 text-xs text-zinc-600">JPEG, PNG, WEBP, AVIF, GIF — до 10 MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                />
              </div>
            ) : (
              /* Preview + confirm */
              <div>
                <div className="flex items-start gap-4">
                  <div className="shrink-0 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800"
                    style={{ width: 240, height: 135 }}>
                    {uploadPreview && (
                      <img src={uploadPreview} alt="Попередній перегляд"
                        className="h-full w-full object-contain" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">{uploadFile.name}</p>
                    <p className="mt-1 text-xs text-zinc-500">{formatSize(uploadFile.size)}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">→ буде конвертовано в WEBP</p>

                    {uploadError && (
                      <p className="mt-2 text-xs text-red-400">{uploadError}</p>
                    )}

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={handleUpload}
                        disabled={uploading}
                        className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
                      >
                        {uploading ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Конвертація...</>
                        ) : (
                          <><Upload className="h-4 w-4" /> Завантажити</>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={resetUpload}
                        disabled={uploading}
                        className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200 disabled:opacity-50"
                      >
                        Скасувати
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════  URL tab  ══════════ */}
        {tab === 'url' && (
          <div className="px-5 py-4">
            <p className="mb-3 text-sm text-zinc-400">Вставте посилання на зображення із зовнішнього сайту</p>
            <div className="flex gap-2">
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => { setExternalUrl(e.target.value); setUrlError(null) }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleUrlInsert() }}
                placeholder="https://example.com/image.jpg"
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
              />
              <button
                type="button"
                onClick={handleUrlInsert}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm text-white transition-colors hover:bg-amber-500"
              >
                Вставити
              </button>
            </div>
            {urlError && (
              <p className="mt-2 text-xs text-red-400">{urlError}</p>
            )}
          </div>
        )}

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
