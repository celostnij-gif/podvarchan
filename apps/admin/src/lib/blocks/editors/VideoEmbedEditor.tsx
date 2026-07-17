'use client'

import type { BlockEditorProps } from '../types'

export function VideoEmbedEditor({ content, onChange }: BlockEditorProps) {
  const title = (content.title as string) ?? ''
  const videoUrl = (content.videoUrl as string) ?? ''
  const caption = (content.caption as string) ?? ''

  const update = (field: string, value: string) => {
    onChange({ ...content, [field]: value })
  }

  // Extract YouTube video ID for preview — use URL parsing to avoid regex escaping issues
  let youtubeId: string | null = null
  try {
    const u = new URL(videoUrl)
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
      if (u.hostname.includes('youtu.be')) {
        youtubeId = u.pathname.slice(1).split('/')[0] || null
      } else {
        youtubeId = u.searchParams.get('v')
      }
    }
  } catch { /* invalid URL — ignore */ }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Заголовок</label>
        <input
          value={title}
          onChange={(e) => update('title', e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          placeholder="Видео о методе"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Ссылка на видео</label>
        <input
          value={videoUrl}
          onChange={(e) => update('videoUrl', e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          placeholder="https://www.youtube.com/watch?v=..."
        />
        <p className="mt-1 text-xs text-zinc-600">Поддерживает YouTube, YouTube Shorts, Vimeo</p>
      </div>
      {youtubeId && (
        <div className="rounded-lg overflow-hidden border border-zinc-700/50">
          <img
            src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
            alt="Video preview"
            className="w-full h-32 object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <div className="px-3 py-2 text-xs text-zinc-500 bg-zinc-900/60">
            YouTube ID: {youtubeId}
          </div>
        </div>
      )}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Подпись</label>
        <input
          value={caption}
          onChange={(e) => update('caption', e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          placeholder="Краткое описание видео"
        />
      </div>
    </div>
  )
}
