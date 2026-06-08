'use client'

/**
 * Медіа-бібліотека — сітка завантажених файлів з можливістю завантаження, видалення та копіювання URL.
 */

/* eslint-disable @next/next/no-img-element */
import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  FileType,
  HardDrive,
} from 'lucide-react'
import type { MediaAsset } from '@/db/schema'
import { uploadMediaAsset, deleteMediaAsset } from '@/lib/actions/media'

/* ═══════════════════════════════════════
   Types
   ═══════════════════════════════════════ */

export interface MediaLibraryProps {
  assets: MediaAsset[]
}

/* ═══════════════════════════════════════
   Toast
   ═══════════════════════════════════════ */

interface ToastState {
  type: 'success' | 'error'
  message: string
}

function Toast({ toast }: { toast: ToastState | null }) {
  if (!toast) return null
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium transition-all duration-300 ${
        toast.type === 'success'
          ? 'bg-green-900/80 border-green-700/40 text-green-300'
          : 'bg-red-900/80 border-red-700/40 text-red-300'
      }`}
    >
      {toast.type === 'success' ? (
        <CheckCircle2 className="w-4 h-4 shrink-0" />
      ) : (
        <AlertTriangle className="w-4 h-4 shrink-0" />
      )}
      <span>{toast.message}</span>
    </div>
  )
}

/* ═══════════════════════════════════════
   Format helpers
   ═══════════════════════════════════════ */

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImage(mime: string): boolean {
  return mime.startsWith('image/')
}

/* ═══════════════════════════════════════
   Main component
   ═══════════════════════════════════════ */

export default function MediaLibrary({ assets }: MediaLibraryProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }, [])

  // ── Upload file(s) ──
  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const result = await uploadMediaAsset(file)
        if (!result.success) {
          showToast('error', `${file.name}: ${result.error}`)
          return
        }
      }
      showToast('success', `Завантажено ${files.length === 1 ? '1 файл' : `${files.length} файла(ов)`}`)
      router.refresh()
    } catch {
      showToast('error', 'Ошибка при загрузке')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [router, showToast])

  // ── Delete ──
  const handleDelete = useCallback(async (asset: MediaAsset) => {
    if (!confirm(`Удалить файл «${asset.originalName}»?`)) return

    setDeletingId(asset.id)
    try {
      const result = await deleteMediaAsset(asset.id)
      if (result.success) {
        showToast('success', 'Файл удален')
        router.refresh()
      } else {
        showToast('error', result.error)
      }
    } catch {
      showToast('error', 'Ошибка при удалении')
    } finally {
      setDeletingId(null)
    }
  }, [router, showToast])

  // ── Copy URL ──
  const handleCopyUrl = useCallback(async (asset: MediaAsset) => {
    try {
      const fullUrl = asset.publicUrl.startsWith('http')
        ? asset.publicUrl
        : `${window.location.origin}${asset.publicUrl}`
      await navigator.clipboard.writeText(fullUrl)
      setCopiedId(asset.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      showToast('error', 'Не удалось скопировать URL')
    }
  }, [showToast])

  // ── Drag & drop ──
  const [dragging, setDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleUpload(e.dataTransfer.files)
  }, [handleUpload])

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      {/* ── Upload zone ── */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
          dragging
            ? 'border-gold/50 bg-gold/5'
            : 'border-zinc-800/50 hover:border-zinc-700/50 bg-zinc-900/20'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.json"
          onChange={(e) => handleUpload(e.target.files)}
          className="hidden"
          aria-label="Выберите файлы для загрузки"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
            <p className="text-sm text-zinc-400">Загрузка...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="w-8 h-8 text-zinc-600" />
            <div>
              <p className="text-sm text-zinc-400">
                Перетащите файлы сюда или{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-gold hover:text-gold-light underline underline-offset-2 transition-colors"
                >
                  выберите их
                </button>
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                Изображения, PDF, JSON &mdash; до 20 MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Stats ── */}
      <div className="flex items-center gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5" />
          {assets.length} {assets.length === 1 ? 'файл' : 'файлов'}
        </span>
        <span className="flex items-center gap-1.5">
          <HardDrive className="w-3.5 h-3.5" />
          {formatFileSize(assets.reduce((sum, a) => sum + a.size, 0))}
        </span>
      </div>

      {/* ── Grid ── */}
      {assets.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="group relative rounded-xl border border-zinc-800/50 bg-zinc-900/30 overflow-hidden transition-all duration-200 hover:border-zinc-700/50 hover:bg-zinc-900/50"
            >
              {/* Preview */}
              <div className="aspect-square bg-zinc-900/70 flex items-center justify-center overflow-hidden">
                {isImage(asset.mimeType) ? (
                  <img
                    src={asset.publicUrl}
                    alt={asset.altRu ?? asset.originalName}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-zinc-600">
                    <FileType className="w-8 h-8" />
                    <span className="text-[10px] font-medium uppercase">{asset.mimeType.split('/').pop()}</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-2.5 space-y-1">
                <p className="text-xs text-zinc-300 truncate" title={asset.originalName}>
                  {asset.originalName}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-600">{formatFileSize(asset.size)}</span>
                  {asset.width && asset.height && (
                    <span className="text-[10px] text-zinc-600">{asset.width}&times;{asset.height}</span>
                  )}
                </div>
              </div>

              {/* Overlay actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCopyUrl(asset)}
                  className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-zinc-100 transition-all"
                  aria-label="Копировать URL"
                  title="Копировать URL"
                >
                  {copiedId === asset.id ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(asset)}
                  disabled={deletingId === asset.id}
                  className="p-2 rounded-lg bg-red-900/60 hover:bg-red-800/60 text-red-300 hover:text-red-200 transition-all disabled:opacity-50"
                  aria-label="Удалить"
                  title="Удалить"
                >
                  {deletingId === asset.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── Empty state ── */
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/20 p-12 text-center">
          <ImageIcon className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-base font-medium text-zinc-300 mb-1">Нет файлов</h3>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto">
            Загрузите изображения, PDF или JSON-файлы для использования в контенте сайта.
          </p>
        </div>
      )}
    </div>
  )
}
