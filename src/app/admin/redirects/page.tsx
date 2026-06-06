'use client'

/**
 * Сторінка управління редиректами (/admin/redirects).
 * Таблиця з усіма правилами + форма додавання нового редиректу.
 */

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ArrowLeftRight,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import type { RedirectRule } from '@/db/schema'
import { getRedirects, createRedirect, updateRedirect, deleteRedirect } from '@/lib/actions/redirects'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

/* ═══════════════════════════════════════
   Types
   ═══════════════════════════════════════ */

interface ToastState {
  type: 'success' | 'error'
  message: string
}

/* ═══════════════════════════════════════
   Form schema
   ═══════════════════════════════════════ */

const RedirectFormSchema = z.object({
  fromPath: z.string().min(1, 'Обязательно').startsWith('/', 'Должен начинаться с /'),
  toPath: z.string().min(1, 'Обязательно').startsWith('/', 'Должен начинаться с /'),
  statusCode: z.string(),
  isEnabled: z.boolean(),
})

type RedirectFormValues = z.infer<typeof RedirectFormSchema>

/* ═══════════════════════════════════════
   Helpers
   ═══════════════════════════════════════ */

function formatDate(d: Date | number | null | undefined): string {
  if (!d) return '—'
  const date = d instanceof Date ? d : new Date(d)
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function pluralize(n: number): string {
  if (n === 1) return 'редирект'
  if (n >= 2 && n <= 4) return 'редиректа'
  return 'редиректов'
}

/* ═══════════════════════════════════════
   Toast
   ═══════════════════════════════════════ */

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
   Field row
   ═══════════════════════════════════════ */

function FieldRow({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-zinc-400 tracking-wide uppercase">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

/* ═══════════════════════════════════════
   Main component
   ═══════════════════════════════════════ */

export default function RedirectsPage() {
  const router = useRouter()
  const [items, setItems] = useState<RedirectRule[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RedirectFormValues>({
    resolver: zodResolver(RedirectFormSchema),
    defaultValues: { fromPath: '', toPath: '', statusCode: '301', isEnabled: true },
  })

  // Load data
  useEffect(() => {
    getRedirects().then((result) => {
      setLoading(false)
      if (result.success) {
        setItems(result.data as RedirectRule[])
      } else {
        showToast('error', result.error)
      }
    }).catch(() => {
      setLoading(false)
      showToast('error', 'Ошибка загрузки редиректов')
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Create ──
  const onCreate = handleSubmit(async (data) => {
    setCreating(true)
    try {
      const result = await createRedirect({
        fromPath: data.fromPath,
        toPath: data.toPath,
        statusCode: Number(data.statusCode),
        isEnabled: data.isEnabled,
      })
      if (result.success) {
        showToast('success', 'Редирект создан')
        reset()
        setShowForm(false)
        const fresh = await getRedirects()
        if (fresh.success) setItems(fresh.data as RedirectRule[])
        router.refresh()
      } else {
        showToast('error', result.error)
      }
    } catch {
      showToast('error', 'Ошибка при создании')
    } finally {
      setCreating(false)
    }
  })

  // ── Toggle enabled ──
  const handleToggle = async (id: string, current: boolean) => {
    setTogglingId(id)
    try {
      const result = await updateRedirect(id, { isEnabled: !current })
      if (result.success) {
        setItems(prev => prev.map(item => item.id === id ? { ...item, isEnabled: !current } : item))
        router.refresh()
      } else {
        showToast('error', result.error)
      }
    } catch {
      showToast('error', 'Ошибка')
    } finally {
      setTogglingId(null)
    }
  }

  // ── Delete ──
  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const result = await deleteRedirect(id)
      if (result.success) {
        showToast('success', 'Редирект удален')
        setItems(prev => prev.filter(item => item.id !== id))
        setDeleteId(null)
        router.refresh()
      } else {
        showToast('error', result.error)
        setDeleteId(null)
      }
    } catch {
      showToast('error', 'Ошибка при удалении')
      setDeleteId(null)
    } finally {
      setDeletingId(null)
    }
  }

  const enabledCount = items.filter(i => i.isEnabled).length

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Редиректы</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {items.length} {pluralize(items.length)} · {enabledCount} активных
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 transition-all duration-200 text-sm font-medium"
        >
          {showForm ? 'Отмена' : <><Plus className="w-4 h-4" /> Добавить редирект</>}
        </button>
      </div>

      {/* ── Create form ── */}
      {showForm && (
        <form onSubmit={onCreate} className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <Plus className="w-4 h-4 text-zinc-500" />
            Новый редирект
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FieldRow label="From (старый путь)" error={errors.fromPath?.message}>
              <input {...register('fromPath')} placeholder="/old-page" className="w-full bg-zinc-900/70 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40" />
            </FieldRow>

            <FieldRow label="To (новый путь)" error={errors.toPath?.message}>
              <input {...register('toPath')} placeholder="/new-page" className="w-full bg-zinc-900/70 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40" />
            </FieldRow>

            <FieldRow label="Код" error={errors.statusCode?.message}>
              <select {...register('statusCode')} className="w-full bg-zinc-900/70 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40">
                <option value="301">301 — Постоянный</option>
                <option value="302">302 — Временный</option>
                <option value="307">307 — Temporary Redirect</option>
                <option value="308">308 — Permanent Redirect</option>
              </select>
            </FieldRow>

            <FieldRow label="Активен">
              <label className="flex items-center gap-2.5 cursor-pointer group pt-2">
                <input type="checkbox" {...register('isEnabled')} className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-gold focus:ring-gold/30 focus:ring-offset-0 cursor-pointer accent-gold" />
                <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">Создать активным</span>
              </label>
            </FieldRow>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 transition-all duration-200 text-sm font-medium disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {creating ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      )}

      {/* ── Table ── */}
      {items.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-zinc-800/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800/50 bg-zinc-900/30">
                <th className="text-left px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">From</th>
                <th className="text-center px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider hidden sm:table-cell">Код</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">To</th>
                <th className="text-center px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider hidden md:table-cell">Хиты</th>
                <th className="text-center px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider hidden lg:table-cell">Дата</th>
                <th className="text-center px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">Статус</th>
                <th className="w-24 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {items.map((rule) => (
                <tr key={rule.id} className="hover:bg-zinc-900/30 transition-colors duration-150 group">
                  <td className="px-4 py-3">
                    <code className="text-zinc-200 text-xs font-mono">{rule.fromPath}</code>
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      rule.statusCode === 301 ? 'bg-green-900/30 text-green-400' :
                      rule.statusCode === 302 ? 'bg-amber-900/30 text-amber-400' :
                      'bg-zinc-800/50 text-zinc-400'
                    }`}>
                      {rule.statusCode}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-zinc-400 text-xs font-mono">{rule.toPath}</code>
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className="text-xs text-zinc-500">{rule.hitCount}</span>
                  </td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    <span className="text-xs text-zinc-600">{formatDate(rule.createdAt)}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggle(rule.id, rule.isEnabled)}
                      disabled={togglingId === rule.id}
                      className={`inline-flex items-center gap-1 text-xs font-medium transition-colors ${
                        rule.isEnabled ? 'text-green-400 hover:text-green-300' : 'text-zinc-500 hover:text-zinc-400'
                      }`}
                    >
                      {togglingId === rule.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : rule.isEnabled
                          ? <><ToggleRight className="w-4 h-4" /> Вкл</>
                          : <><ToggleLeft className="w-4 h-4" /> Выкл</>
                      }
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {deleteId === rule.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDelete(rule.id)}
                          disabled={deletingId === rule.id}
                          className="px-2 py-1 rounded text-[11px] font-medium bg-red-900/40 text-red-300 hover:bg-red-900/60 disabled:opacity-50"
                        >
                          {deletingId === rule.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Удалить'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(null)}
                          className="px-2 py-1 rounded text-[11px] text-zinc-500 hover:text-zinc-300"
                        >
                          Отмена
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteId(rule.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 inline-flex items-center justify-center w-7 h-7 rounded-lg hover:bg-red-900/30 hover:text-red-400 text-zinc-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── Empty state ── */
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/20 p-12 text-center">
          <ArrowLeftRight className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-base font-medium text-zinc-300 mb-1">Нет редиректов</h3>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto">
            Редиректы создаются автоматически при смене slug у опубликованного контента.
            Вы также можете добавить их вручную.
          </p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 transition-all duration-200 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Добавить редирект
          </button>
        </div>
      )}
    </div>
  )
}
