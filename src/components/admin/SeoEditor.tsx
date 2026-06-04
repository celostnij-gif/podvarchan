'use client'

/**
 * Редактор SEO-метаданих — форма для редагування seo_meta запису.
 */

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import {
  Save,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Search,
  Globe,
  Share2,
} from 'lucide-react'
import type { SeoMeta } from '@/db/schema'
import { updateSeoMeta, toggleSeoRobots } from '@/lib/actions/seo'

/* ═══════════════════════════════════════
   Types
   ═══════════════════════════════════════ */

export interface SeoEditorProps {
  meta: SeoMeta
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

const SeoFormSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.string().optional(),
  canonicalPath: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImageId: z.string().optional(),
  robotsIndex: z.boolean(),
  robotsFollow: z.boolean(),
  schemaType: z.string().optional(),
})

type SeoFormValues = z.infer<typeof SeoFormSchema>

/* ═══════════════════════════════════════
   Entity label
   ═══════════════════════════════════════ */

const ENTITY_LABELS: Record<string, string> = {
  SERVICE: 'Услуга',
  BLOG_POST: 'Статья',
  PAGE: 'Страница',
  FAQ: 'FAQ',
  TESTIMONIAL: 'Отзыв',
  BLOG_CATEGORY: 'Категория блога',
}

/* ═══════════════════════════════════════
   Field row
   ═══════════════════════════════════════ */

function FieldRow({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: React.ReactNode
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <label className="block text-xs font-medium text-zinc-400 tracking-wide uppercase">{label}</label>
        {hint && <span className="text-[10px] text-zinc-600">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

function Input({
  registration,
  placeholder,
  rows,
  maxLength,
}: {
  registration: UseFormRegisterReturn
  placeholder?: string
  rows?: number
  maxLength?: number
}) {
  const baseClass =
    'w-full bg-zinc-900/70 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all duration-200'

  if (rows) {
    return <textarea {...registration} rows={rows} placeholder={placeholder} maxLength={maxLength} className={`${baseClass} resize-y min-h-[60px]`} />
  }

  return <input {...registration} placeholder={placeholder} maxLength={maxLength} className={baseClass} />
}

/* ═══════════════════════════════════════
   Character counter
   ═══════════════════════════════════════ */

function CharCount({ text, max }: { text?: string; max: number }) {
  const len = text?.length ?? 0
  const pct = len / max
  return (
    <span className={`text-[10px] ${pct > 0.9 ? 'text-red-400' : pct > 0.7 ? 'text-amber-400' : 'text-zinc-600'}`}>
      {len}/{max}
    </span>
  )
}

/* ═══════════════════════════════════════
   Main component
   ═══════════════════════════════════════ */

export default function SeoEditor({ meta }: SeoEditorProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [togglingRobots, setTogglingRobots] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SeoFormValues>({
    resolver: zodResolver(SeoFormSchema),
    defaultValues: {
      title: meta.title ?? '',
      description: meta.description ?? '',
      keywords: meta.keywords ?? '',
      canonicalPath: meta.canonicalPath ?? '',
      ogTitle: meta.ogTitle ?? '',
      ogDescription: meta.ogDescription ?? '',
      ogImageId: meta.ogImageId ?? '',
      robotsIndex: meta.robotsIndex,
      robotsFollow: meta.robotsFollow,
      schemaType: meta.schemaType ?? '',
    },
  })

  const titleVal = watch('title') // eslint-disable-line react-hooks/incompatible-library
  const descVal = watch('description')
  const ogTitleVal = watch('ogTitle')
  const robotsIndexVal = watch('robotsIndex')

  // ── Save ──
  const onSave = handleSubmit(async (data) => {
    setSaving(true)
    try {
      const cleanData = {
        ...data,
        title: data.title || undefined,
        description: data.description || undefined,
        ogTitle: data.ogTitle || undefined,
        ogDescription: data.ogDescription || undefined,
      }
      const result = await updateSeoMeta(meta.id, cleanData)
      if (result.success) {
        showToast('success', 'SEO-мета сохранено')
        router.refresh()
      } else {
        showToast('error', result.error)
      }
    } catch {
      showToast('error', 'Ошибка при сохранении')
    } finally {
      setSaving(false)
    }
  })

  // ── Toggle robots ──
  const handleToggleRobots = async () => {
    setTogglingRobots(true)
    try {
      const result = await toggleSeoRobots(meta.id)
      if (result.success) {
        showToast('success', 'Статус индексации изменен')
        router.refresh()
      } else {
        showToast('error', result.error)
      }
    } catch {
      showToast('error', 'Ошибка')
    } finally {
      setTogglingRobots(false)
    }
  }

  const entityLabel = ENTITY_LABELS[meta.entityType] ?? meta.entityType

  return (
    <>
      <Toast toast={toast} />

      <form onSubmit={onSave} className="space-y-8">
        {/* ═══════════════════════════════════════
            Entity info
           ═══════════════════════════════════════ */}
        <section className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800/70 flex items-center justify-center">
              <Search className="w-4 h-4 text-zinc-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-200">
                {entityLabel}
              </h2>
              <p className="text-xs text-zinc-500">
                {meta.locale === 'ru' ? 'Русский' : 'Українська'} · ID: {meta.entityId.slice(0, 12)}…
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            Basic SEO
           ═══════════════════════════════════════ */}
        <section className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-6 space-y-5">
          <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-zinc-800/70 flex items-center justify-center">
              <Globe className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            Основные SEO-поля
          </h2>

          <FieldRow label="Meta Title" hint={titleVal ? <CharCount text={titleVal} max={60} /> : undefined} error={errors.title?.message}>
            <Input registration={register('title')} placeholder="Заголовок страницы (до 60 символов)" maxLength={60} />
          </FieldRow>

          <FieldRow label="Meta Description" hint={descVal ? <CharCount text={descVal} max={160} /> : undefined} error={errors.description?.message}>
            <Input registration={register('description')} placeholder="Краткое описание страницы (до 160 символов)" rows={3} maxLength={160} />
          </FieldRow>

          <FieldRow label="Keywords" hint="Через запятую">
            <Input registration={register('keywords')} placeholder="гипнотерапия, тревога, психосоматика" />
          </FieldRow>

          <FieldRow label="Canonical Path" hint="Абсолютный путь, напр. /uslugi/gipnoterapiya">
            <Input registration={register('canonicalPath')} placeholder="/ru/uslugi/gipnoterapiya-onlayn" />
          </FieldRow>

          <FieldRow label="Schema Type" hint="Schema.org тип">
            <Input registration={register('schemaType')} placeholder="MedicalBusiness, Article, FAQPage..." />
          </FieldRow>
        </section>

        {/* ═══════════════════════════════════════
            Open Graph
           ═══════════════════════════════════════ */}
        <section className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-6 space-y-5">
          <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-zinc-800/70 flex items-center justify-center">
              <Share2 className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            Open Graph / Social
          </h2>

          <FieldRow label="OG Title" hint={ogTitleVal ? <CharCount text={ogTitleVal} max={60} /> : undefined}>
            <Input registration={register('ogTitle')} placeholder="Заголовок для соцсетей (до 60 символов)" maxLength={60} />
          </FieldRow>

          <FieldRow label="OG Description">
            <Input registration={register('ogDescription')} placeholder="Описание для соцсетей" rows={2} maxLength={160} />
          </FieldRow>

          <FieldRow label="OG Image ID">
            <Input registration={register('ogImageId')} placeholder="ID изображения из медиатеки" />
            <p className="text-[10px] text-zinc-600 mt-1">
              Выберите изображение в{' '}
              <Link href="/admin/media" className="text-gold hover:text-gold-light underline underline-offset-2">медиатеке</Link>
              {' '}и скопируйте его ID.
            </p>
          </FieldRow>
        </section>

        {/* ═══════════════════════════════════════
            Robots
           ═══════════════════════════════════════ */}
        <section className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-zinc-800/70 flex items-center justify-center">
              <Eye className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            Индексация
          </h2>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                robotsIndexVal ? 'bg-green-900/30 text-green-400' : 'bg-zinc-800/50 text-zinc-500'
              }`}>
                {robotsIndexVal ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200">
                  {robotsIndexVal ? 'Страница индексируется' : 'Страница скрыта от индексации'}
                </p>
                <p className="text-xs text-zinc-500">
                  robots: {robotsIndexVal ? 'index, follow' : 'noindex, nofollow'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleRobots}
              disabled={togglingRobots}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border bg-zinc-900/50 border-zinc-800/50 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700/50 disabled:opacity-50"
            >
              {togglingRobots ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : robotsIndexVal ? 'Скрыть' : 'Показать'}
            </button>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                {...register('robotsIndex')}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-gold focus:ring-gold/30 focus:ring-offset-0 cursor-pointer accent-gold"
              />
              <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">index</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                {...register('robotsFollow')}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-gold focus:ring-gold/30 focus:ring-offset-0 cursor-pointer accent-gold"
              />
              <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">follow</span>
            </label>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            Actions
           ═══════════════════════════════════════ */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-zinc-600">
            ID: <code className="text-zinc-500 bg-zinc-900/70 px-1.5 py-0.5 rounded text-[11px]">{meta.id.slice(0, 12)}…</code>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </>
  )
}
