'use client'

/**
 * Редактор відгуку — форма для створення та редагування відгуків.
 */

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Save,
  Trash2,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Star,
} from 'lucide-react'
import type { Testimonial, TestimonialTranslation } from '@/db/schema'
import { createTestimonial, updateTestimonial, deleteTestimonial, publishTestimonial } from '@/lib/actions/testimonials'
import StatusBadge from './StatusBadge'

/* ═══════════════════════════════════════
   Types
   ═══════════════════════════════════════ */

type TestimonialData = Testimonial & { translations: TestimonialTranslation[] }

export interface TestimonialEditorProps {
  mode: 'create' | 'edit'
  item?: TestimonialData
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
      {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
      <span>{toast.message}</span>
    </div>
  )
}

/* ═══════════════════════════════════════
   Form schema
   ═══════════════════════════════════════ */

const TestimonialFormSchema = z.object({
  clientName: z.string().min(1, 'Имя клиента обязательно'),
  clientAge: z.number().int().min(10).max(120).optional().or(z.literal(0)),
  avatarInitials: z.string().max(4).optional(),
  rating: z.number().int().min(1).max(5).optional().or(z.literal(0)),
  source: z.string().optional(),
  consentConfirmed: z.boolean(),
  sortOrder: z.number().int(),
  translations: z.array(z.object({
    locale: z.enum(['ru', 'uk']),
    text: z.string().min(1, 'Текст отзыва обязателен'),
    problem: z.string().optional(),
    result: z.string().optional(),
  })).min(1),
})

type TestimonialFormValues = z.infer<typeof TestimonialFormSchema>

/* ═══════════════════════════════════════
   Default values
   ═══════════════════════════════════════ */

const DEFAULT_TRANSLATIONS: TestimonialFormValues['translations'] = [
  { locale: 'ru', text: '', problem: '', result: '' },
  { locale: 'uk', text: '', problem: '', result: '' },
]

function itemToFormValues(item: TestimonialData): TestimonialFormValues {
  return {
    clientName: item.clientName,
    clientAge: item.clientAge ?? 0,
    avatarInitials: item.avatarInitials ?? '',
    rating: item.rating ?? 0,
    source: item.source ?? '',
    consentConfirmed: item.consentConfirmed,
    sortOrder: item.sortOrder,
    translations: DEFAULT_TRANSLATIONS.map((def) => {
      const t = item.translations.find((tr) => tr.locale === def.locale)
      return {
        locale: def.locale as 'ru' | 'uk',
        text: t?.text ?? '',
        problem: t?.problem ?? '',
        result: t?.result ?? '',
      }
    }),
  }
}

/* ═══════════════════════════════════════
   Field row
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
  rows,
  type = 'text',
}: {
  registration: UseFormRegisterReturn
  placeholder?: string
  rows?: number
  type?: string
}) {
  const baseClass =
    'w-full bg-zinc-900/70 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all duration-200'

  if (type === 'checkbox') {
    return (
      <input
        type="checkbox"
        {...registration}
        className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-gold focus:ring-gold/30 focus:ring-offset-0 cursor-pointer accent-gold"
      />
    )
  }

  if (rows) {
    return <textarea {...registration} rows={rows} placeholder={placeholder} className={`${baseClass} resize-y min-h-[80px]`} />
  }

  return <input {...registration} type={type} placeholder={placeholder} className={baseClass} />
}

/* ═══════════════════════════════════════
   Main component
   ═══════════════════════════════════════ */

export default function TestimonialEditor({ mode, item }: TestimonialEditorProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'ru' | 'uk'>('ru')
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  const defaultValues = mode === 'edit' && item ? itemToFormValues(item) : {
    clientName: '',
    clientAge: 0,
    avatarInitials: '',
    rating: 0,
    source: '',
    consentConfirmed: false,
    sortOrder: 0,
    translations: DEFAULT_TRANSLATIONS,
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<TestimonialFormValues>({
    resolver: zodResolver(TestimonialFormSchema),
    defaultValues,
  })

  const watchTranslations = watch('translations') // eslint-disable-line react-hooks/incompatible-library

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }, [])

  // ── Save ──
  const onSave = handleSubmit(async (data) => {
    setSaving(true)
    try {
      const cleanData = {
        ...data,
        clientAge: data.clientAge || undefined,
        rating: data.rating || undefined,
      }

      if (mode === 'create') {
        const result = await createTestimonial(cleanData)
        if (result.success) {
          showToast('success', 'Отзыв создан')
          router.push(`/admin/testimonials/${result.data.id}`)
          router.refresh()
        } else {
          showToast('error', result.error)
        }
      } else if (item) {
        const result = await updateTestimonial(item.id, cleanData)
        if (result.success) {
          showToast('success', 'Отзыв сохранен')
          router.refresh()
        } else {
          showToast('error', result.error)
        }
      }
    } catch {
      showToast('error', 'Ошибка при сохранении')
    } finally {
      setSaving(false)
    }
  })

  // ── Publish ──
  const handlePublish = async () => {
    if (!item) return
    setPublishing(true)
    try {
      const result = await publishTestimonial(item.id)
      if (result.success) {
        showToast('success', 'Статус изменен')
        router.refresh()
      } else {
        showToast('error', result.error)
      }
    } catch {
      showToast('error', 'Ошибка')
    } finally {
      setPublishing(false)
    }
  }

  // ── Delete ──
  const handleDelete = async () => {
    if (!item) return
    setDeleting(true)
    try {
      const result = await deleteTestimonial(item.id)
      if (result.success) {
        showToast('success', 'Отзыв удален')
        router.push('/admin/testimonials')
        router.refresh()
      } else {
        showToast('error', result.error)
        setShowDeleteConfirm(false)
      }
    } catch {
      showToast('error', 'Ошибка при удалении')
      setShowDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Toast toast={toast} />

      <form onSubmit={onSave} className="space-y-8">
        {/* ═══════════════════════════════════════
            Client info
           ═══════════════════════════════════════ */}
        <section className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-6 space-y-5">
          <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-zinc-800/70 flex items-center justify-center">
              <Star className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            Информация о клиенте
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FieldRow label="Имя клиента" error={errors.clientName?.message}>
              <Input registration={register('clientName')} placeholder="Анна М." />
            </FieldRow>

            <FieldRow label="Возраст">
              <input
                type="number"
                min={10}
                max={120}
                {...register('clientAge', { valueAsNumber: true })}
                className="w-full bg-zinc-900/70 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all duration-200"
                placeholder="35"
              />
            </FieldRow>

            <FieldRow label="Инициалы (аватар)">
              <Input registration={register('avatarInitials')} placeholder="АМ" />
            </FieldRow>

            <FieldRow label="Рейтинг (1–5)">
              <input
                type="number"
                min={1}
                max={5}
                {...register('rating', { valueAsNumber: true })}
                className="w-full bg-zinc-900/70 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all duration-200"
                placeholder="5"
              />
            </FieldRow>

            <FieldRow label="Источник">
              <Input registration={register('source')} placeholder="Google Maps" />
            </FieldRow>

            <FieldRow label="Порядок">
              <input
                type="number"
                min={0}
                {...register('sortOrder', { valueAsNumber: true })}
                className="w-full bg-zinc-900/70 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all duration-200"
                placeholder="0"
              />
            </FieldRow>

            <FieldRow label="Согласие на публикацию">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <Input registration={register('consentConfirmed')} type="checkbox" />
                <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
                  Подтверждено
                </span>
              </label>
            </FieldRow>

            {mode === 'edit' && item && (
              <FieldRow label="Статус">
                <StatusBadge
                  status={
                    item.status === 'PUBLISHED'
                      ? 'published'
                      : item.status === 'HIDDEN'
                        ? 'hidden'
                        : 'draft'
                  }
                />
              </FieldRow>
            )}
          </div>
        </section>

        {/* ═══════════════════════════════════════
            Translations
           ═══════════════════════════════════════ */}
        <section className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 overflow-hidden">
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
                  {t?.text && <span className="w-1.5 h-1.5 rounded-full bg-green-400/60" />}
                </button>
              )
            })}
          </div>

          <div className="p-6 space-y-5">
            {(() => {
              const index = activeTab === 'ru' ? 0 : 1
              const locale = activeTab
              const transErrors = errors.translations?.[index]

              return (
                <div key={locale} className="space-y-5">
                  <FieldRow label={`Текст отзыва (${locale})`} error={transErrors?.text?.message}>
                    <Input
                      registration={register(`translations.${index}.text`)}
                      placeholder="Текст отзыва..."
                      rows={5}
                    />
                  </FieldRow>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FieldRow label="Проблема (с чем пришел)">
                      <Input
                        registration={register(`translations.${index}.problem`)}
                        placeholder="Тревога, бессонница..."
                      />
                    </FieldRow>

                    <FieldRow label="Результат">
                      <Input
                        registration={register(`translations.${index}.result`)}
                        placeholder="Стал спокойнее, наладил сон..."
                      />
                    </FieldRow>
                  </div>
                </div>
              )
            })()}
          </div>
        </section>

        {/* ═══════════════════════════════════════
            Actions
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
                  {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                  {item?.status === 'PUBLISHED' ? 'Скрыть' : item?.status === 'HIDDEN' ? 'Опубликовать' : 'Опубликовать'}
                </button>

                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-red-900/20 text-red-400 border border-red-800/30 hover:bg-red-900/30"
                  >
                    <Trash2 className="w-4 h-4" /> Удалить
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
                      {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      Да, удалить
                    </button>
                    <button type="button" onClick={() => setShowDeleteConfirm(false)} className="px-3 py-2 rounded-xl text-xs font-medium text-zinc-500 hover:text-zinc-300">
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
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Сохранение...' : mode === 'create' ? 'Создать' : 'Сохранить'}
          </button>
        </div>
      </form>
    </>
  )
}
