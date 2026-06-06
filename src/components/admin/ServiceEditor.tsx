'use client'

/**
 * Редактор послуги — форма для створення та редагування.
 * Використовує react-hook-form + zod для валідації.
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
  FileJson,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import type { Service, ServiceTranslation } from '@/db/schema'
import { createService, updateService, deleteService, publishService } from '@/lib/actions/services'
import StatusBadge from './StatusBadge'
import { useBeforeUnload } from '@/hooks/useBeforeUnload'

/* ═══════════════════════════════════════
   Types
   ═══════════════════════════════════════ */

type ServiceData = Service & { translations: ServiceTranslation[] }

export interface ServiceEditorProps {
  mode: 'create' | 'edit'
  service?: ServiceData
}

/* ═══════════════════════════════════════
   Toast component
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
   Zod schemas for form
   ═══════════════════════════════════════ */

const TranslationFormSchema = z.object({
  locale: z.enum(['ru', 'uk']),
  title: z.string().min(1, 'Название обязательно'),
  shortTitle: z.string().optional(),
  description: z.string().optional(),
  slug: z.string().min(1, 'Slug обязателен'),
  heroTitle: z.string().optional(),
  heroSubtitle: z.string().optional(),
  symptomsJson: z.string().optional(),
  processJson: z.string().optional(),
  benefitsJson: z.string().optional(),
  faqJson: z.string().optional(),
  ctaText: z.string().optional(),
})

const ServiceFormSchema = z.object({
  slugBase: z.string().min(1, 'Slug-base обязателен').regex(/^[a-z0-9-]+$/, 'Только латиница, цифры и дефисы'),
  icon: z.string().optional(),
  category: z.string().optional(),
  priority: z.number().int().min(1).max(10),
  featured: z.boolean(),
  translations: z.array(TranslationFormSchema).min(1, 'Нужен хотя бы один перевод'),
})

type ServiceFormValues = z.infer<typeof ServiceFormSchema>

/* ═══════════════════════════════════════
   Default values
   ═══════════════════════════════════════ */

const DEFAULT_TRANSLATIONS: ServiceFormValues['translations'] = [
  {
    locale: 'ru',
    title: '',
    shortTitle: '',
    description: '',
    slug: '',
    heroTitle: '',
    heroSubtitle: '',
    symptomsJson: '',
    processJson: '',
    benefitsJson: '',
    faqJson: '',
    ctaText: '',
  },
  {
    locale: 'uk',
    title: '',
    shortTitle: '',
    description: '',
    slug: '',
    heroTitle: '',
    heroSubtitle: '',
    symptomsJson: '',
    processJson: '',
    benefitsJson: '',
    faqJson: '',
    ctaText: '',
  },
]

function serviceToFormValues(s: ServiceData): ServiceFormValues {
  return {
    slugBase: s.slugBase,
    icon: s.icon ?? '',
    category: s.category ?? '',
    priority: s.priority,
    featured: s.featured,
    translations: DEFAULT_TRANSLATIONS.map((def) => {
      const t = s.translations.find((tr) => tr.locale === def.locale)
      return {
        locale: def.locale as 'ru' | 'uk',
        title: t?.title ?? '',
        shortTitle: t?.shortTitle ?? '',
        description: t?.description ?? '',
        slug: t?.slug ?? '',
        heroTitle: t?.heroTitle ?? '',
        heroSubtitle: t?.heroSubtitle ?? '',
        symptomsJson: t?.symptomsJson ?? '',
        processJson: t?.processJson ?? '',
        benefitsJson: t?.benefitsJson ?? '',
        faqJson: t?.faqJson ?? '',
        ctaText: t?.ctaText ?? '',
      }
    }),
  }
}

/* ═══════════════════════════════════════
   Field row wrapper
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

/* ═══════════════════════════════════════
   Input component
   ═══════════════════════════════════════ */

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
   Main component
   ═══════════════════════════════════════ */

export default function ServiceEditor({ mode, service }: ServiceEditorProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'ru' | 'uk'>('ru')
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  // Form
  const defaultValues = mode === 'edit' && service ? serviceToFormValues(service) : {
    slugBase: '',
    icon: '',
    category: '',
    priority: 3,
    featured: false,
    translations: DEFAULT_TRANSLATIONS,
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty: formDirty },
    watch,
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(ServiceFormSchema),
    defaultValues,
  })

  // ── Dirty tracking for useBeforeUnload (built-in react-hook-form) ──
  useBeforeUnload(formDirty)

  const watchTranslations = watch('translations') // eslint-disable-line react-hooks/incompatible-library

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }, [])

  // ── Save ──
  const onSave = handleSubmit(async (data) => {
    setSaving(true)
    try {
      if (mode === 'create') {
        const result = await createService(data)
        if (result.success) {
          showToast('success', 'Услуга создана')
          router.push(`/admin/services/${result.data.id}`)
          router.refresh()
        } else {
          showToast('error', result.error)
        }
      } else if (service) {
        const result = await updateService(service.id, data)
        if (result.success) {
          showToast('success', 'Услуга сохранена')
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

  // ── Publish / Unpublish ──
  const handlePublish = async () => {
    if (!service) return
    setPublishing(true)
    try {
      const result = await publishService(service.id)
      if (result.success) {
        showToast('success', result.message ?? 'Статус изменен')
        router.refresh()
      } else {
        showToast('error', result.error)
      }
    } catch {
      showToast('error', 'Произошла ошибка')
    } finally {
      setPublishing(false)
    }
  }

  // ── Delete ──
  const handleDelete = async () => {
    if (!service) return
    setDeleting(true)
    try {
      const result = await deleteService(service.id)
      if (result.success) {
        showToast('success', 'Услуга удалена')
        router.push('/admin/services')
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
          href="/admin/services"
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
              <FileJson className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            Основные настройки
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FieldRow label="Slug-base" error={errors.slugBase?.message}>
              <Input
                registration={register('slugBase')}
                placeholder="naprimer-massazh"
              />
            </FieldRow>

            <FieldRow label="Иконка (emoji)" error={errors.icon?.message}>
              <Input
                registration={register('icon')}
                placeholder="💆"
              />
            </FieldRow>

            <FieldRow label="Категория" error={errors.category?.message}>
              <Input
                registration={register('category')}
                placeholder="massage"
              />
            </FieldRow>

            <FieldRow label="Приоритет (1–10)" error={errors.priority?.message}>
              <input
                type="number"
                min={1}
                max={10}
                {...register('priority', { valueAsNumber: true })}
                className="w-full bg-zinc-900/70 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all duration-200"
              />
            </FieldRow>

            <FieldRow label="Featured">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  {...register('featured')}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-gold focus:ring-gold/30 focus:ring-offset-0 cursor-pointer accent-gold"
                />
                <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
                  Показывать на главной
                </span>
              </label>
            </FieldRow>

            {mode === 'edit' && service && (
              <FieldRow label="Статус">
                <StatusBadge
                  status={
                    service.status === 'PUBLISHED'
                      ? 'published'
                      : service.status === 'ARCHIVED'
                        ? 'archived'
                        : 'draft'
                  }
                />
              </FieldRow>
            )}
          </div>
        </section>

        {/* ═══════════════════════════════════════
            SECTION 2: Translations
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

          {/* Tab content — render only the active tab */}
          <div className="p-6 space-y-5">
            {(() => {
              const index = activeTab === 'ru' ? 0 : 1
              const locale = activeTab
              const transErrors = errors.translations?.[index]

                return (
                  <div key={locale} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FieldRow
                        label={`Название (${locale})`}
                        error={transErrors?.title?.message}
                      >
                        <Input
                          registration={register(`translations.${index}.title`)}
                          placeholder="Например: Массаж спины"
                        />
                      </FieldRow>

                      <FieldRow
                        label={`Slug (${locale})`}
                        error={transErrors?.slug?.message}
                      >
                        <Input
                          registration={register(`translations.${index}.slug`)}
                          placeholder="massazh-spiny"
                        />
                      </FieldRow>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FieldRow label="Короткое название">
                        <Input
                          registration={register(`translations.${index}.shortTitle`)}
                          placeholder="Массаж спины"
                        />
                      </FieldRow>

                      <FieldRow label="Текст CTA">
                        <Input
                          registration={register(`translations.${index}.ctaText`)}
                          placeholder="Записаться на массаж"
                        />
                      </FieldRow>
                    </div>

                    <FieldRow label="Описание">
                      <Input
                        registration={register(`translations.${index}.description`)}
                        placeholder="Краткое описание услуги для списка и SEO"
                        rows={3}
                      />
                    </FieldRow>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FieldRow label="Hero-заголовок">
                        <Input
                          registration={register(`translations.${index}.heroTitle`)}
                          placeholder="Профессиональный массаж спины"
                        />
                      </FieldRow>

                      <FieldRow label="Hero-подзаголовок">
                        <Input
                          registration={register(`translations.${index}.heroSubtitle`)}
                          placeholder="Снимет напряжение и боль"
                        />
                      </FieldRow>
                    </div>

                    <details className="group">
                      <summary className="flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors duration-200 list-none">
                        <Plus className="w-3.5 h-3.5 group-open:rotate-45 transition-transform duration-200" />
                        <span>Дополнительные JSON-поля (симптомы, процесс, преимущества, FAQ)</span>
                      </summary>
                      <div className="mt-4 space-y-4">
                        <FieldRow label="Симптомы (JSON-массив)">
                          <Input
                            registration={register(`translations.${index}.symptomsJson`)}
                            placeholder='["Боль в спине", "Напряжение мышц"]'
                            rows={3}
                          />
                        </FieldRow>

                        <FieldRow label="Процесс (JSON-массив шагов)">
                          <Input
                            registration={register(`translations.${index}.processJson`)}
                            placeholder='[{"title": "Шаг 1", "description": "..."}]'
                            rows={3}
                          />
                        </FieldRow>

                        <FieldRow label="Преимущества (JSON-массив)">
                          <Input
                            registration={register(`translations.${index}.benefitsJson`)}
                            placeholder='["Снятие боли", "Расслабление"]'
                            rows={3}
                          />
                        </FieldRow>

                        <FieldRow label="FAQ (JSON-массив вопрос/ответ)">
                          <Input
                            registration={register(`translations.${index}.faqJson`)}
                            placeholder='[{"question": "...", "answer": "..."}]'
                            rows={3}
                          />
                        </FieldRow>
                      </div>
                    </details>
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
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={publishing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-green-900/20 text-green-400 border border-green-800/30 hover:bg-green-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {publishing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Globe className="w-4 h-4" />
                  )}
                  {service?.status === 'PUBLISHED' ? 'Снять с публикации' : 'Опубликовать'}
                </button>

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

          {/* Save button — always visible */}
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
