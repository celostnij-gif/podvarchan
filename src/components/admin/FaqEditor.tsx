'use client'

/**
 * Редактор FAQ — форма для створення та редагування запитань.
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
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import type { FaqItem, FaqItemTranslation } from '@/db/schema'
import { createFaqItem, updateFaqItem, deleteFaqItem } from '@/lib/actions/faq'

/* ═══════════════════════════════════════
   Types
   ═══════════════════════════════════════ */

type FaqData = FaqItem & { translations: FaqItemTranslation[] }

export interface FaqEditorProps {
  mode: 'create' | 'edit'
  item?: FaqData
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
   Form schema
   ═══════════════════════════════════════ */

const FaqFormSchema = z.object({
  group: z.enum(['HOME', 'GENERAL', 'SERVICE', 'CONTACTS']),
  sortOrder: z.number().int().min(0).max(999),
  translations: z.array(z.object({
    locale: z.enum(['ru', 'uk']),
    question: z.string().min(1, 'Вопрос обязателен'),
    answer: z.string().min(1, 'Ответ обязателен'),
  })).min(1),
})

type FaqFormValues = z.infer<typeof FaqFormSchema>

/* ═══════════════════════════════════════
   Default values
   ═══════════════════════════════════════ */

const DEFAULT_TRANSLATIONS: FaqFormValues['translations'] = [
  { locale: 'ru', question: '', answer: '' },
  { locale: 'uk', question: '', answer: '' },
]

function itemToFormValues(item: FaqData): FaqFormValues {
  return {
    group: item.group,
    sortOrder: item.sortOrder,
    translations: DEFAULT_TRANSLATIONS.map((def) => {
      const t = item.translations.find((tr) => tr.locale === def.locale)
      return {
        locale: def.locale as 'ru' | 'uk',
        question: t?.question ?? '',
        answer: t?.answer ?? '',
      }
    }),
  }
}

const GROUP_OPTIONS = [
  { value: 'GENERAL', label: 'Общие' },
  { value: 'HOME', label: 'Главная' },
  { value: 'SERVICE', label: 'Услуги' },
  { value: 'CONTACTS', label: 'Контакты' },
] as const

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
}: {
  registration: UseFormRegisterReturn
  placeholder?: string
  rows?: number
}) {
  const baseClass =
    'w-full bg-zinc-900/70 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all duration-200'

  if (rows) {
    return <textarea {...registration} rows={rows} placeholder={placeholder} className={`${baseClass} resize-y min-h-[80px]`} />
  }

  return <input {...registration} placeholder={placeholder} className={baseClass} />
}

/* ═══════════════════════════════════════
   Main component
   ═══════════════════════════════════════ */

export default function FaqEditor({ mode, item }: FaqEditorProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'ru' | 'uk'>('ru')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  const defaultValues = mode === 'edit' && item ? itemToFormValues(item) : {
    group: 'GENERAL' as const,
    sortOrder: 0,
    translations: DEFAULT_TRANSLATIONS,
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FaqFormValues>({
    resolver: zodResolver(FaqFormSchema),
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
      if (mode === 'create') {
        const result = await createFaqItem(data)
        if (result.success) {
          showToast('success', 'Вопрос создан')
          router.push(`/admin/faq/${result.data.id}`)
          router.refresh()
        } else {
          showToast('error', result.error)
        }
      } else if (item) {
        const result = await updateFaqItem(item.id, data)
        if (result.success) {
          showToast('success', 'Вопрос сохранен')
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

  // ── Delete ──
  const handleDelete = async () => {
    if (!item) return
    setDeleting(true)
    try {
      const result = await deleteFaqItem(item.id)
      if (result.success) {
        showToast('success', 'Вопрос удален')
        router.push('/admin/faq')
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
            Settings
           ═══════════════════════════════════════ */}
        <section className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-6 space-y-5">
          <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-zinc-800/70 flex items-center justify-center">
              <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            Настройки
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FieldRow label="Группа">
              <select
                {...register('group')}
                className="w-full bg-zinc-900/70 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all duration-200"
              >
                {GROUP_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </FieldRow>

            <FieldRow label="Порядок сортировки" error={errors.sortOrder?.message}>
              <input
                type="number"
                min={0}
                max={999}
                {...register('sortOrder', { valueAsNumber: true })}
                className="w-full bg-zinc-900/70 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all duration-200"
              />
            </FieldRow>
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
                  {t?.question && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400/60" />
                  )}
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
                  <FieldRow
                    label={`Вопрос (${locale})`}
                    error={transErrors?.question?.message}
                  >
                    <Input
                      registration={register(`translations.${index}.question`)}
                      placeholder="Введите вопрос..."
                    />
                  </FieldRow>

                  <FieldRow
                    label={`Ответ (${locale})`}
                    error={transErrors?.answer?.message}
                  >
                    <Input
                      registration={register(`translations.${index}.answer`)}
                      placeholder="Введите ответ..."
                      rows={4}
                    />
                  </FieldRow>
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
                      {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
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
