'use client'

import { useActionState, useState, useCallback, useRef, type FormEvent } from 'react'
import Link from 'next/link'
import { createPost, updatePost } from '@/lib/actions/blog'
import { TipTapEditor } from '@/components/admin/editor/TipTapEditor'
import { MediaPickerDialog } from '@/components/admin/media/MediaPickerDialog'
import { StructuredListEditor } from '@/components/admin/StructuredListEditor'
import { slugify } from '@/lib/slugify'
import type { PostWithTranslations } from '../types'
import { isRedirectError } from 'next/dist/client/components/redirect-error'

interface Props {
  post?: PostWithTranslations
  categories: { id: string; slugBase: string; ruName?: string }[]
  /** Resolved cover image URL for preview (server-resolved from coverImageId) */
  coverImageResolvedUrl?: string
}

export function PostForm({ post, categories, coverImageResolvedUrl }: Props) {
  const isEdit = !!post
  const [ruContentHtml, setRuContentHtml] = useState(post?.translations.find(t => t.locale === 'ru')?.contentHtml ?? '')
  const [ruContentJson, setRuContentJson] = useState(post?.translations.find(t => t.locale === 'ru')?.contentJson ?? '')
  const [ukContentHtml, setUkContentHtml] = useState(post?.translations.find(t => t.locale === 'uk')?.contentHtml ?? '')
  const [ukContentJson, setUkContentJson] = useState(post?.translations.find(t => t.locale === 'uk')?.contentJson ?? '')
  const [ruFaqJson, setRuFaqJson] = useState(post?.translations.find(t => t.locale === 'ru')?.faqJson ?? '')
  const [ukFaqJson, setUkFaqJson] = useState(post?.translations.find(t => t.locale === 'uk')?.faqJson ?? '')
  // Display URL for preview/input
  const [coverImageUrl, setCoverImageUrl] = useState(coverImageResolvedUrl ?? post?.coverImageId ?? '')
  // Actual value to store in DB (UUID from media_assets or URL if typed manually)
  const [coverImageIdState, setCoverImageIdState] = useState(post?.coverImageId ?? '')
  const [showCoverPicker, setShowCoverPicker] = useState(false)
  const statusRef = useRef<HTMLSelectElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const slugAutoRef = useRef(!isEdit)

  function handleTitleChange(locale: 'ru' | 'uk', value: string) {
    if (!slugAutoRef.current) return
    const slugInput = document.getElementById(`${locale}_slug`) as HTMLInputElement | null
    if (slugInput) slugInput.value = slugify(value)
  }

  function handlePublish(e: FormEvent, status: string) {
    e.preventDefault()
    if (statusRef.current) statusRef.current.value = status
    formRef.current?.requestSubmit()
  }

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      // Inject JSON content into formData
      formData.set('ru_contentHtml', ruContentHtml)
      formData.set('ru_contentJson', ruContentJson)
      formData.set('uk_contentHtml', ukContentHtml)
      formData.set('uk_contentJson', ukContentJson)
      formData.set('ru_faqJson', ruFaqJson)
      formData.set('uk_faqJson', ukFaqJson)
      formData.set('coverImageId', coverImageIdState)
      try {
        if (isEdit) {
          await updatePost(post!.id, formData)
        } else {
          await createPost(formData)
        }
        return null
      } catch (err) {
        if (isRedirectError(err)) throw err
        return { error: err instanceof Error ? err.message : 'Невідома помилка' }
      }
    },
    null,
  )

  const tr = useCallback((locale: string, field: string): string => {
    if (!post) return ''
    const t = post.translations.find((tr) => tr.locale === locale)
    if (!t) return ''
    return (t as unknown as Record<string, string | null>)[field] ?? ''
  }, [post])

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-lg border border-red-900/50 bg-red-900/20 p-3 text-sm text-red-400">{state.error}</div>
      )}

      {/* Hidden status — controlled by CTA buttons */}
      <select ref={statusRef} name="status" defaultValue={post?.status ?? 'DRAFT'} className="hidden">
        <option value="DRAFT">Чернетка</option>
        <option value="REVIEW">На рев&apos;ю</option>
        <option value="PUBLISHED">Опубліковано</option>
        <option value="ARCHIVED">Архів</option>
      </select>

      <fieldset className="rounded-lg border border-zinc-700/50 p-4">
        <legend className="text-sm font-semibold text-zinc-300">Загальні поля</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-zinc-300">Категорія</label>
            <select id="categoryId" name="categoryId" defaultValue={post?.categoryId ?? ''}
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30">
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.ruName ?? c.slugBase}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="readingMinutes" className="block text-sm font-medium text-zinc-300">Читання (хв)</label>
            <input id="readingMinutes" name="readingMinutes" type="number" min={0} defaultValue={post?.readingMinutes ?? 0}
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
          </div>
          <div>
            <label htmlFor="publishedAt" className="block text-sm font-medium text-zinc-300">Дата публікації</label>
            <input id="publishedAt" name="publishedAt" type="date" defaultValue={post?.publishedAt?.slice(0, 10) ?? ''}
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
          </div>
        </div>

        {/* Cover image */}
        <div className="mt-4 border-t pt-4">
          <label className="block text-sm font-medium text-zinc-300 mb-2">Обкладинка посту</label>
          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-3">
              {/* Primary: MediaPicker */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowCoverPicker(true)}
                  className="rounded-lg bg-amber-600/20 border border-amber-600/30 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-600/30 transition-colors"
                >
                  Медіатека
                </button>
                {coverImageUrl && (
                  <button
                    type="button"
                    onClick={() => { setCoverImageUrl(''); setCoverImageIdState('') }}
                    className="rounded-lg bg-red-900/30 px-3 py-2 text-sm text-red-400 hover:bg-red-900/50"
                  >
                    Видалити
                  </button>
                )}
              </div>

              {/* Advanced: manual URL input */}
              <details className="text-xs text-zinc-500">
                <summary className="cursor-pointer select-none hover:text-zinc-300">
                  Ввести URL вручну
                </summary>
                <input
                  type="text"
                  value={coverImageUrl}
                  onChange={(e) => { setCoverImageUrl(e.target.value); setCoverImageIdState(e.target.value) }}
                  placeholder="/api/media/... або /images/..."
                  className="mt-2 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                />
              </details>
            </div>

            {/* Preview */}
            {coverImageUrl && (
              <div className="shrink-0 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800" style={{ width: 160, height: 90 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImageUrl}
                  alt="Обкладинка"
                  className="h-full w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.querySelector('.cover-error')?.classList.remove('hidden'); }}
                />
                <div className="hidden cover-error flex items-center justify-center h-full text-xs text-zinc-500">
                  Невірний URL
                </div>
              </div>
            )}
          </div>
        </div>
      </fieldset>

      <MediaPickerDialog
        open={showCoverPicker}
        onClose={() => setShowCoverPicker(false)}
        onSelect={(asset) => {
          if (asset.publicUrl) setCoverImageUrl(asset.publicUrl)
          if (asset.id) setCoverImageIdState(asset.id)
          setShowCoverPicker(false)
        }}
      />

      {/* RU locale */}
  <fieldset className="rounded-lg border border-zinc-700/50 p-4">
    <legend className="text-sm font-semibold text-amber-400">🇷🇺 Російська</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ru_slug" className="block text-sm font-medium text-zinc-300">Slug *</label>
            <input id="ru_slug" name="ru_slug" defaultValue={tr('ru', 'slug')} required
              onChange={() => { slugAutoRef.current = false }}
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
          </div>
          <div>
            <label htmlFor="ru_title" className="block text-sm font-medium text-zinc-300">Заголовок *</label>
            <input id="ru_title" name="ru_title" defaultValue={tr('ru', 'title')} required
              onChange={(e) => handleTitleChange('ru', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="ru_excerpt" className="block text-sm font-medium text-zinc-300">Короткий опис</label>
            <textarea id="ru_excerpt" name="ru_excerpt" rows={2} defaultValue={tr('ru', 'excerpt')}
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-zinc-300 mb-1">Контент (RU)</label>
            <TipTapEditor
              value={ruContentHtml}
              onChange={(html, json) => { setRuContentHtml(html); setRuContentJson(json) }}
              placeholder="Введіть текст статті..."
              onImageSelected={(asset) => {
                if (asset.publicUrl) setCoverImageUrl(asset.publicUrl)
                if (asset.id) setCoverImageIdState(asset.id)
              }}
            />
            <input type="hidden" name="ru_contentHtml" value={ruContentHtml} />
            <input type="hidden" name="ru_contentJson" value={ruContentJson} />
          </div>
          <div className="sm:col-span-2">
            <input type="hidden" name="ru_faqJson" value={ruFaqJson} />
            <StructuredListEditor
              value={ruFaqJson}
              onChange={setRuFaqJson}
              fields={[
                { key: 'question', label: 'Питання' },
                { key: 'answer', label: 'Відповідь', type: 'textarea' },
              ]}
              emptyItem={{ question: '', answer: '' }}
              label="FAQ до статті (RU)"
            />
          </div>
        </div>
      </fieldset>

      {/* UK locale */}
      <fieldset className="rounded-lg border border-zinc-700/50 p-4">
        <legend className="text-sm font-semibold text-amber-400">🇺🇦 Українська</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="uk_slug" className="block text-sm font-medium text-zinc-300">Slug *</label>
            <input id="uk_slug" name="uk_slug" defaultValue={tr('uk', 'slug')} required
              onChange={() => { slugAutoRef.current = false }}
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
          </div>
          <div>
            <label htmlFor="uk_title" className="block text-sm font-medium text-zinc-300">Заголовок *</label>
            <input id="uk_title" name="uk_title" defaultValue={tr('uk', 'title')} required
              onChange={(e) => handleTitleChange('uk', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="uk_excerpt" className="block text-sm font-medium text-zinc-300">Короткий опис</label>
            <textarea id="uk_excerpt" name="uk_excerpt" rows={2} defaultValue={tr('uk', 'excerpt')}
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-zinc-300 mb-1">Контент (UK)</label>
            <TipTapEditor
              value={ukContentHtml}
              onChange={(html, json) => { setUkContentHtml(html); setUkContentJson(json) }}
              placeholder="Введіть текст статті..."
              onImageSelected={(asset) => {
                if (asset.publicUrl) setCoverImageUrl(asset.publicUrl)
                if (asset.id) setCoverImageIdState(asset.id)
              }}
            />
            <input type="hidden" name="uk_contentHtml" value={ukContentHtml} />
            <input type="hidden" name="uk_contentJson" value={ukContentJson} />
          </div>
          <div className="sm:col-span-2">
            <input type="hidden" name="uk_faqJson" value={ukFaqJson} />
            <StructuredListEditor
              value={ukFaqJson}
              onChange={setUkFaqJson}
              fields={[
                { key: 'question', label: 'Питання' },
                { key: 'answer', label: 'Відповідь', type: 'textarea' },
              ]}
              emptyItem={{ question: '', answer: '' }}
              label="FAQ до статті (UK)"
            />
          </div>
        </div>
      </fieldset>

      <div className="flex items-center gap-3 border-t pt-4">
        <button type="button" disabled={pending} onClick={(e) => handlePublish(e, 'DRAFT')}
          className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
          {pending ? 'Збереження...' : 'Зберегти чернетку'}
        </button>
        <button type="button" disabled={pending} onClick={(e) => handlePublish(e, 'PUBLISHED')}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
          {pending ? 'Публікація...' : 'Опублікувати'}
        </button>
        <Link href="/admin/blog/posts"
          className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800">
          Скасувати
        </Link>
      </div>

      {/* Advanced: manual status override */}
      {isEdit && (
        <details className="text-xs text-zinc-500">
          <summary className="cursor-pointer select-none hover:text-zinc-300">
            Ручне налаштування статусу
          </summary>
          <div className="mt-2">
            <label htmlFor="status-override" className="block text-xs font-medium text-zinc-400 mb-1">Статус</label>
            <select
              id="status-override"
              onChange={(e) => { if (statusRef.current) statusRef.current.value = e.target.value }}
              defaultValue={post?.status ?? 'DRAFT'}
              className="block w-48 rounded border border-zinc-700 bg-zinc-900/50 px-2 py-1.5 text-xs text-zinc-200 focus:border-amber-500/50 focus:outline-none"
            >
              <option value="DRAFT">Чернетка</option>
              <option value="REVIEW">На рев&apos;ю</option>
              <option value="PUBLISHED">Опубліковано</option>
              <option value="ARCHIVED">Архів</option>
            </select>
          </div>
        </details>
      )}
    </form>
  )
}
