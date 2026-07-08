'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Check, AlertCircle, Loader2 } from 'lucide-react'

/* ───── types ───── */

type FileStatus = 'pending' | 'optimizing' | 'uploading' | 'done' | 'error'

interface UploadItem {
  id: string
  name: string
  preview: string
  status: FileStatus
  progress: number
  error?: string
}

/* ───── helpers ───── */

async function optimizeImage(file: File): Promise<{
  blob: Blob
  width: number
  height: number
}> {
  const img = await createImageBitmap(file)
  let w = img.width
  let h = img.height

  // Downscale to max 1600 px keeping aspect ratio
  const MAX = 1600
  if (w > MAX || h > MAX) {
    const ratio = Math.min(MAX / w, MAX / h)
    w = Math.round(w * ratio)
    h = Math.round(h * ratio)
  }

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)
  img.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('WebP conversion failed'))
        resolve({ blob, width: w, height: h })
      },
      'image/webp',
      0.82,
    )
  })
}

/* ───── component ───── */

export function UploadZone() {
  const [items, setItems] = useState<UploadItem[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadId = useRef(0)

  /* update a single item */
  const updateItem = useCallback(
    (id: string, patch: Partial<UploadItem>) =>
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i))),
    [],
  )

  /* remove a single item & revoke its preview URL */
  const removeItem = useCallback(
    (id: string) =>
      setItems((prev) => {
        const item = prev.find((i) => i.id === id)
        if (item?.preview) URL.revokeObjectURL(item.preview)
        return prev.filter((i) => i.id !== id)
      }),
    [],
  )

  /* process & upload a single file */
  const uploadFile = useCallback(async (item: UploadItem, file: File) => {
    const isImage = file.type.startsWith('image/') && !file.type.includes('svg')

    let body: FormData
    if (isImage) {
      updateItem(item.id, { status: 'optimizing' })
      const { blob, width, height } = await optimizeImage(file)
      // Keep original extension in name for display, but the blob is WebP
      const webpName = file.name.replace(/\.[^.]+$/, '.webp')
      body = new FormData()
      body.append('file', blob, webpName)
      body.append('width', String(width))
      body.append('height', String(height))
    } else {
      body = new FormData()
      body.append('file', file)
    }

    updateItem(item.id, { status: 'uploading', progress: 10 })

    try {
      const res = await fetch('/api/admin/media/upload', { method: 'POST', body })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }

      updateItem(item.id, { status: 'done', progress: 100 })
    } catch (err) {
      updateItem(item.id, {
        status: 'error',
        error: err instanceof Error ? err.message : 'Upload failed',
      })
    }
  }, [updateItem])

  /* add files to the queue */
  const enqueue = useCallback(
    (fileList: FileList | File[]) => {
      const incoming = Array.from(fileList).map((file) => {
        const id = `upload-${++uploadId.current}`
        const item: UploadItem = {
          id,
          name: file.name,
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
          status: 'pending',
          progress: 0,
        }
        // Start upload in next microtask
        setTimeout(() => uploadFile(item, file), 0)
        return item
      })
      setItems((prev) => [...prev, ...incoming])
    },
    [uploadFile],
  )

  /* drag‑and‑drop handlers */
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])
  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])
  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      if (e.dataTransfer.files.length) enqueue(e.dataTransfer.files)
    },
    [enqueue],
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) enqueue(e.target.files)
      e.target.value = ''
    },
    [enqueue],
  )

  /* ─── render ─── */

  const hasItems = items.length > 0
  const doneCount = items.filter((i) => i.status === 'done').length
  const errorCount = items.filter((i) => i.status === 'error').length

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors
          ${isDragOver
            ? 'border-gold/60 bg-gold/5'
            : 'border-zinc-700 bg-zinc-800/40 hover:border-zinc-600 hover:bg-zinc-800/60'
          }`}
      >
        <Upload className="mb-3 h-8 w-8 text-gray-400" />
        <p className="text-sm font-medium text-gray-300">
          {isDragOver ? 'Відпустіть файли для завантаження' : 'Перетягніть файли сюди або натисніть для вибору'}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Зображення автоматично конвертуються в WebP. Максимальний розмір — 10 MB
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {/* Upload queue */}
      {hasItems && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>
              {doneCount}/{items.length} завантажено
              {errorCount > 0 && `, ${errorCount} помилок`}
            </span>
            {doneCount === items.length && (
              <span className="flex items-center gap-1 text-green-400">
                <Check className="h-3.5 w-3.5" /> Готово
              </span>
            )}
          </div>

          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-3"
              >
                {/* Preview / icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-zinc-800">
                  {item.preview ? (
                    <img src={item.preview} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Upload className="h-4 w-4 text-gray-500" />
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-gray-200">{item.name}</p>

                  {/* Progress bar */}
                  {item.status !== 'done' && item.status !== 'error' && (
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-700">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          item.status === 'optimizing'
                            ? 'w-1/2 animate-pulse bg-amber-500'
                            : 'bg-gold'
                        }`}
                        style={{
                          width: item.status === 'uploading' ? `${Math.max(10, item.progress)}%` : undefined,
                        }}
                      />
                    </div>
                  )}

                  {/* Status text */}
                  {item.status === 'optimizing' && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-amber-400">
                      <Loader2 className="h-3 w-3 animate-spin" /> Оптимізація...
                    </p>
                  )}
                  {item.status === 'uploading' && (
                    <p className="mt-0.5 text-xs text-gray-400">Завантаження...</p>
                  )}
                  {item.status === 'error' && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-red-400">
                      <AlertCircle className="h-3 w-3" /> {item.error || 'Помилка'}
                    </p>
                  )}
                  {item.status === 'done' && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-green-400">
                      <Check className="h-3 w-3" /> Готово
                    </p>
                  )}
                </div>

                {/* Actions */}
                {item.status === 'done' ? (
                  <button
                    onClick={() => removeItem(item.id)}
                    className="shrink-0 rounded-md p-1 text-gray-500 hover:bg-zinc-700 hover:text-gray-300"
                    title="Прибрати"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => removeItem(item.id)}
                    className="shrink-0 rounded-md p-1 text-gray-500 hover:bg-zinc-700 hover:text-gray-300"
                    title="Скасувати"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
