'use client'

import type { BlockEditorProps } from '../types'

interface GalleryImage {
  url?: string
  alt?: string
  caption?: string
}

export function GalleryEditor({ content, onChange }: BlockEditorProps) {
  const title = (content.title as string) ?? ''
  const images = (content.images as GalleryImage[]) ?? []

  const updateTitle = (value: string) => {
    onChange({ ...content, title: value })
  }

  const updateImage = (index: number, field: keyof GalleryImage, value: string) => {
    const newImages = [...images]
    newImages[index] = { ...newImages[index], [field]: value }
    onChange({ ...content, images: newImages })
  }

  const addImage = () => {
    onChange({ ...content, images: [...images, { url: '', alt: '', caption: '' }] })
  }

  const removeImage = (index: number) => {
    onChange({ ...content, images: images.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Заголовок</label>
        <input
          value={title}
          onChange={(e) => updateTitle(e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          placeholder="Галерея"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-2">Изображения</label>
        <div className="space-y-3">
          {images.map((img, i) => (
            <div key={i} className="relative rounded-lg border border-zinc-700/50 bg-zinc-900/30 p-3">
              <div className="absolute right-2 top-2 flex gap-1">
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newImages = [...images]
                      ;[newImages[i - 1], newImages[i]] = [newImages[i], newImages[i - 1]]
                      onChange({ ...content, images: newImages })
                    }}
                    className="rounded px-1 py-0.5 text-xs text-zinc-500 hover:bg-zinc-800"
                  >
                    ↑
                  </button>
                )}
                {i < images.length - 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newImages = [...images]
                      ;[newImages[i], newImages[i + 1]] = [newImages[i + 1], newImages[i]]
                      onChange({ ...content, images: newImages })
                    }}
                    className="rounded px-1 py-0.5 text-xs text-zinc-500 hover:bg-zinc-800"
                  >
                    ↓
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="rounded px-1.5 py-0.5 text-xs text-red-400 hover:bg-red-900/30"
                >
                  ✕
                </button>
              </div>
              {img.url && (
                <div className="mb-2 rounded-lg overflow-hidden border border-zinc-700/50 w-32 h-20">
                  <img
                    src={img.url}
                    alt={img.alt ?? ''}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-[10px] font-medium text-zinc-500 mb-0.5">URL</label>
                  <input
                    value={img.url ?? ''}
                    onChange={(e) => updateImage(i, 'url', e.target.value)}
                    className="w-full rounded border border-zinc-700 bg-zinc-800/50 px-2 py-1.5 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none"
                    placeholder="/api/media/..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-zinc-500 mb-0.5">Alt текст</label>
                  <input
                    value={img.alt ?? ''}
                    onChange={(e) => updateImage(i, 'alt', e.target.value)}
                    className="w-full rounded border border-zinc-700 bg-zinc-800/50 px-2 py-1.5 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none"
                    placeholder="Описание"
                  />
                </div>
              </div>
              <div className="mt-2">
                <label className="block text-[10px] font-medium text-zinc-500 mb-0.5">Подпись</label>
                <input
                  value={img.caption ?? ''}
                  onChange={(e) => updateImage(i, 'caption', e.target.value)}
                  className="w-full rounded border border-zinc-700 bg-zinc-800/50 px-2 py-1.5 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none"
                  placeholder="Подпись к изображению"
                />
              </div>
            </div>
          ))}
          {images.length === 0 && (
            <p className="text-xs text-zinc-600 text-center py-4 border border-dashed border-zinc-800 rounded-lg">
              Пока нет изображений — добавьте первое
            </p>
          )}
          <button
            type="button"
            onClick={addImage}
            className="w-full rounded-lg border border-dashed border-zinc-700/50 py-2 text-xs text-zinc-500 hover:border-zinc-600 hover:text-zinc-400 transition-colors"
          >
            + Добавить изображение
          </button>
        </div>
      </div>
    </div>
  )
}
