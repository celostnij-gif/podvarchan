'use client'

/**
 * Редактор статті блогу — форма для створення та редагування.
 * Використовує react-hook-form + zod + TipTap для контенту.
 */

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Save,
  ArrowLeft,
  Trash2,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Clock,
  BookOpen,
} from 'lucide-react'
import type { BlogPost, BlogPostTranslation, BlogCategory } from '@/db/schema'
import { createBlogPost, updateBlogPost, deleteBlogPost, updateBlogPostStatus } from '@/lib/actions/blog'
import TipTapEditor from './TipTapEditor'
import { useBeforeUnload } from '@/hooks/useBeforeUnload'

/* ═══════════════════════════════════════
   Types
   ═══════════════════════════════════════ */

type BlogData = BlogPost & {
  translations: BlogPostTranslation[]
  categories: BlogCategory[]
}

export interface BlogEditorProps {
  mode: 'create' | 'edit'
  post?: BlogData
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
   Form schemas
   ═══════════════════════════════════════ */

const TranslationFormSchema = z.object({
  locale: z.enum(['ru', 'uk']),
  title: z.string().min(1, 'Название обязательно'),
  slug: z.string().min(1, 'Slug обязателен'),
  excerpt: z.string().optional(),
  contentJson: z.string().optional(),
  contentHtml: z.string().optional(),
})

const BlogFormSchema = z.object({
  categoryId: z.string().optional(),
  readingMinutes: z.number().int().min(1).max(120),
  translations: z.array(TranslationFormSchema).min(1, 'Нужен хотя бы один перевод'),
})

type BlogFormValues = z.infer<typeof BlogFormSchema>

/* ═══════════════════════════════════════
   Default values
   ═══════════════════════════════════════ */

const DEFAULT_TRANSLATIONS: BlogFormValues['translations'] = [
  {
    locale: 'ru',
    title: '',
    slug: '',
    excerpt: '',
    contentJson: '',
    contentHtml: '',
  },
  {
    locale: 'uk',
    title: '',
    slug: '',
    excerpt: '',
    contentJson: '',
    contentHtml: '',
  },
]

function postToFormValues(p: BlogData): BlogFormValues {
  return {
    categoryId: p.categoryId ?? undefined,
    readingMinutes: p.readingMinutes,
    translations: DEFAULT_TRANSLATIONS.map((def) => {
      const t = p.translations.find((tr) => tr.locale === def.locale)
      return {
        locale: def.locale as 'ru' | 'uk',
        title: t?.title ?? '',
        slug: t?.slug ?? '',
        excerpt: t?.excerpt ?? '',
        contentJson: t?.contentJson ?? '',
        contentHtml: t?.contentHtml ?? '',
      }
    }),
  }
}

/* ═══════════════════════════════════════
   Field components
   ═══════════════════════════════════════ */

function FieldRow({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-zinc-400 tracking-wide uppercase">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

function Input({
  registration,
  placeholder,
  className = '',
  rows,
}: {
  registration: UseFormRegisterReturn
  placeholder?: string
  className?: string
  rows?: number
}) {
  const baseClass =
    'w-full bg-zinc-900/70 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all duration-200'

  if (rows) {
    return <textarea {...registration} rows={rows} placeholder={placeholder} className={`${baseClass} resize-y min-h-[60px] ${className}`} />
  }

  return <input {...registration} placeholder={placeholder} className={`${baseClass} ${className}`} />
}

/* ═══════════════════════════════════════
   Status helpers
   ═══════════════════════════════════════ */

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'DRAFT', label: 'Черновик' },
  { value: 'REVIEW', label: 'На проверке' },
  { value: 'PUBLISHED', label: 'Опубликовано' },
  { value: 'ARCHIVED', label: 'Архив' },
]

/* ═══════════════════════════════════════
   Main component
   ═══════════════════════════════════════ */

export default function BlogEditor({ mode, post }: BlogEditorProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'ru' | 'uk'>('ru')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  // ── Dirty tracking for useBeforeUnload ──
  const [isDirty, setIsDirty] = useState(false)
  useBeforeUnload(isDirty)

  // ── TipTap content state per locale ──
  const [editorContent, setEditorContent] = useState<Record<string, { json: string; html: string }>>({
    ru: { json: post?.translations.find((t) => t.locale === 'ru')?.contentJson ?? '', html: post?.translations.find((t) => t.locale === 'ru')?.contentHtml ?? '' },
    uk: { json: post?.translations.find((t) => t.locale === 'uk')?.contentJson ?? '', html: post?.translations.find((t) => t.locale === 'uk')?.contentHtml ?? '' },
  })

  // Form
  const defaultValues = mode === 'edit' && post ? postToFormValues(post) : {
    categoryId: undefined as string | undefined,
    readingMinutes: 5,
    translations: DEFAULT_TRANSLATIONS,
  }

  const categories = post?.categories ?? []

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    watch,
  } = useForm<BlogFormValues>({
    resolver: zodResolver(BlogFormSchema),
    defaultValues,
  })

  const watchTranslations = watch('translations') // eslint-disable-line react-hooks/incompatible-library

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }, [])

  // ── TipTap change handler ──
  const handleEditorChange = useCallback((locale: 'ru' | 'uk', json: string, html: string) => {
    setEditorContent((prev) => ({ ...prev, [locale]: { json, html } }))
    const idx = locale === 'ru' ? 0 : 1
    setValue(`translations.${idx}.contentJson`, json)
    setValue(`translations.${idx}.contentHtml`, html)
    setIsDirty(true)
  }, [setValue])

  // ── Save ──
  const onSave = handleSubmit(async (data) => {
    setSaving(true)
    try {
      if (mode === 'create') {
        const result = await createBlogPost(data)
        if (result.success) {
          showToast('success', 'Статья создана')
          setIsDirty(false)
          router.push(`/admin/blog/${result.data.id}`)
          router.refresh()
        } else {
          showToast('error', result.error)
        }
      } else if (post) {
        const result = await updateBlogPost(post.id, data)
        if (result.success) {
          showToast('success', 'Статья сохранена')
          setIsDirty(false)
          router.refresh()
        } else {
          showToast('error', result.error)
        }
      }
    } catch {
      showToast('error', 'Произошла ошибка при сохранении')
    } finally {
      setSaving(false)
    }
  })

  // ── Status change ──
  const handleStatusChange = async (status: string) => {
    if (!post) return
    setSaving(true)
    try {
      const result = await updateBlogPostStatus(post.id, status)
      if (result.success) {
        showToast('success', result.message ?? 'Статус изменен')
        router.refresh()
      } else {
        showToast('error', result.error)
      }
    } catch {
      showToast('error', 'Произошла ошибка')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ──
  const handleDelete = async () => {
    if (!post) return
    setDeleting(true)
    try {
      const result = await deleteBlogPost(post.id)
      if (result.success) {
        showToast('success', 'Статья удалена')
        router.push('/admin/blog')
        router.refresh()
      } else {
        showToast('error', result.error)
        setShowDeleteConfirm(false)
      }
    } catch {
      showToast('error', 'Произошла ошибка')
      setShowDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Toast toast={toast} />

      <form onSubmit={onSave} className="space-y-8">
        {/* ── Back link ── */}
        <Link
          href="/admin/blog"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors duration-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Назад к списку
        </Link>

        {/* ═══════════════════════════════════════
            SECTION 1: Basic settings
           ═══════════════════════════════════════ */}
        <section className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-6 space-y-5">
          <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-zinc-800/70 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            Настройки статьи
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Category */}
            <FieldRow label="Категория">
              <select
                {...register('categoryId')}
                className="w-full bg-zinc-900/70 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all duration-200"
              >
                <option value="">Без категории</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.slugBase}
                  </option>
                ))}
              </select>
            </FieldRow>

            {/* Reading time */}
            <FieldRow label="Время чтения (мин)" error={errors.readingMinutes?.message}>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                <input
                  type="number"
                  min={1}
                  max={120}
                  {...register('readingMinutes', { valueAsNumber: true })}
                  className="w-full bg-zinc-900/70 border border-zinc-800/50 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all duration-200"
                />
              </div>
            </FieldRow>

            {/* Status (edit mode only) */}
            {mode === 'edit' && post && (
              <FieldRow label="Статус">
                <div className="flex items-center gap-2 flex-wrap">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleStatusChange(opt.value)}
                      disabled={post.status === opt.value}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
                        post.status === opt.value
                          ? 'bg-gold/10 border-gold/20 text-gold cursor-default'
                          : 'bg-zinc-900/50 border-zinc-800/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700/50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </FieldRow>
            )}
          </div>
        </section>

        {/* ═══════════════════════════════════════
            SECTION 2: Translations with TipTap
           ═══════════════════════════════════════ */}
        <section className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-zinc-800/50">
            {(['ru', 'uk'] as const).map((locale) => {
              const t = watchTranslations?.find((tr) => tr.locale === locale)
              return (
                <button
                  key={locale}
                  type="button"
                  onClick={() => setActiveTab(locale)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                    activeTab === locale
                      ? 'text-gold border-gold/60 bg-gold/[0.02]'
                      : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-800/20'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  {locale === 'ru' ? 'Русский' : 'Українська'}
                  {t?.title && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400/60" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          <div className="p-6 space-y-5">
            {(() => {
              const index = activeTab === 'ru' ? 0 : 1
              const locale = activeTab
              const transErrors = errors.translations?.[index]

              return (
                <div key={locale} className="space-y-5">
                  {/* Title + Slug */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FieldRow
                      label={`Заголовок (${locale})`}
                      error={transErrors?.title?.message}
                    >
                      <Input
                        registration={register(`translations.${index}.title`)}
                        placeholder="Например: Польза массажа спины"
                      />
                    </FieldRow>
                    <FieldRow
                      label={`Slug (${locale})`}
                      error={transErrors?.slug?.message}
                    >
                      <Input
                        registration={register(`translations.${index}.slug`)}
                        placeholder="polza-massazha-spiny"
                      />
                    </FieldRow>
                  </div>

                  {/* Excerpt */}
                  <FieldRow label="Краткое описание">
                    <Input
                      registration={register(`translations.${index}.excerpt`)}
                      placeholder="Краткое описание статьи для превью и SEO"
                      rows={2}
                    />
                  </FieldRow>

                  {/* TipTap Editor */}
                  <FieldRow label="Содержание статьи">
                    <TipTapEditor
                      content={editorContent[locale]?.html ?? ''}
                      onChange={(json, html) => handleEditorChange(locale, json, html)}
                      placeholder="Начните писать статью…"
                    />
                  </FieldRow>
                </div>
              )
            })()}
          </div>
        </section>

        {/* ═══════════════════════════════════════
            SECTION 3: Actions
           ═══════════════════════════════════════ */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {mode === 'edit' && (
              <>
                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-red-900/20 text-red-400 border border-red-800/30 hover:bg-red-900/30"
                  >
                    <Trash2 className="w-4 h-4" />
                    Удалить
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-400/80">Подтвердите удаление:</span>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-red-900/30 text-red-300 border border-red-800/40 hover:bg-red-900/40 disabled:opacity-50"
                    >
                      {deleting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      Да, удалить
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-2 rounded-xl text-xs font-medium text-zinc-500 hover:text-zinc-300"
                    >
                      Отмена
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Сохранение...' : mode === 'create' ? 'Создать' : 'Сохранить'}
          </button>
        </div>
      </form>
    </>
  )
}
