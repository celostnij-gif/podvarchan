'use client'

/**
 * Сторінка деталей заявки (/admin/leads/[id]).
 * Показує інформацію про заявку, історію подій, дозволяє змінювати статус та додавати нотатки.
 */

import { useState, useCallback, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Mail,
  Phone,
  MessageSquare,
  Globe,
  Clock,
  User,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  History,
} from 'lucide-react'
import type { ContactLead, LeadEvent } from '@/db/schema'
import { getLead, updateLeadStatus, addLeadNote, deleteLead } from '@/lib/actions/leads'
import { StatusBadge } from '@/components/admin'

/* ═══════════════════════════════════════
   Types
   ═══════════════════════════════════════ */

interface LeadWithEvents extends ContactLead {
  events: LeadEvent[]
}

interface ToastState {
  type: 'success' | 'error'
  message: string
}

/* ═══════════════════════════════════════
   Status config
   ═══════════════════════════════════════ */

const STATUS_OPTIONS: { value: string; label: string; variant: 'review' | 'active' | 'published' | 'scheduled' | 'archived' | 'spam' }[] = [
  { value: 'NEW',         label: 'Новая',       variant: 'review' },
  { value: 'IN_PROGRESS', label: 'В работе',    variant: 'active' },
  { value: 'CONTACTED',   label: 'Связались',   variant: 'published' },
  { value: 'BOOKED',      label: 'Записан',     variant: 'scheduled' },
  { value: 'CLOSED',      label: 'Закрыта',     variant: 'archived' },
  { value: 'SPAM',        label: 'Спам',        variant: 'spam' },
]

const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  STATUS_CHANGE: { label: 'Статус изменен', color: 'text-blue-400' },
  NOTE:          { label: 'Нотатка',        color: 'text-zinc-400' },
  CONTACTED:     { label: 'Связались',      color: 'text-green-400' },
  BOOKED:        { label: 'Запись',         color: 'text-amber-400' },
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
   Format helpers
   ═══════════════════════════════════════ */

function formatDate(d: Date | number | null | undefined): string {
  if (!d) return '—'
  const date = d instanceof Date ? d : new Date(d)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/* ═══════════════════════════════════════
   Page
   ═══════════════════════════════════════ */

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [lead, setLead] = useState<LeadWithEvents | null>(null)
  const [loading, setLoading] = useState(true)
  const [changingStatus, setChangingStatus] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [error, setError] = useState<string | null>(null)

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }, [])

  // Load data
  useEffect(() => {
    getLead(id).then((result) => {
      setLoading(false)
      if (result.success) {
        setLead(result.data as LeadWithEvents)
      } else {
        setError(result.error)
      }
    }).catch(() => {
      setLoading(false)
      setError('Ошибка загрузки заявки')
    })
  }, [id])

  // ── Status change ──
  const handleStatusChange = async (status: string) => {
    if (!lead) return
    setChangingStatus(status)
    try {
      const result = await updateLeadStatus(lead.id, status)
      if (result.success) {
        showToast('success', 'Статус обновлен')
        const fresh = await getLead(lead.id)
        if (fresh.success) setLead(fresh.data as LeadWithEvents)
        router.refresh()
      } else {
        showToast('error', result.error)
      }
    } catch {
      showToast('error', 'Ошибка')
    } finally {
      setChangingStatus(null)
    }
  }

  // ── Add note ──
  const handleAddNote = async () => {
    if (!lead || !noteText.trim()) return
    setSavingNote(true)
    try {
      const result = await addLeadNote(lead.id, noteText.trim())
      if (result.success) {
        showToast('success', 'Нотатка добавлена')
        setNoteText('')
        const fresh = await getLead(lead.id)
        if (fresh.success) setLead(fresh.data as LeadWithEvents)
        router.refresh()
      } else {
        showToast('error', result.error)
      }
    } catch {
      showToast('error', 'Ошибка')
    } finally {
      setSavingNote(false)
    }
  }

  // ── Delete ──
  const handleDelete = async () => {
    if (!lead) return
    setDeleting(true)
    try {
      const result = await deleteLead(lead.id)
      if (result.success) {
        showToast('success', 'Заявка удалена')
        router.push('/admin/leads')
        router.refresh()
      } else {
        showToast('error', result.error)
        setShowDeleteConfirm(false)
      }
    } catch {
      showToast('error', 'Ошибка')
      setShowDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    )
  }

  // ── Error ──
  if (error || !lead) {
    return (
      <div className="space-y-6">
        <Link href="/admin/leads" className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors duration-200">
          <ArrowLeft className="w-3.5 h-3.5" /> Назад к списку
        </Link>
        <div className="rounded-xl border border-red-800/30 bg-red-900/10 p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-400">{error ?? 'Заявка не найдена'}</p>
        </div>
      </div>
    )
  }

  const currentStatusCfg = STATUS_OPTIONS.find((s) => s.value === lead.status) ?? STATUS_OPTIONS[0]

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      {/* ── Back link ── */}
      <Link href="/admin/leads" className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors duration-200">
        <ArrowLeft className="w-3.5 h-3.5" /> Назад к списку
      </Link>

      {/* ═══════════════════════════════════════
          Client info
         ═══════════════════════════════════════ */}
      <section className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-800/70 flex items-center justify-center">
              <User className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">{lead.name}</h2>
              <StatusBadge status={currentStatusCfg.variant} label={currentStatusCfg.label} />
            </div>
          </div>
          <div className="text-xs text-zinc-500 flex items-center gap-1">
            <Clock className="w-3 h-3" aria-hidden="true" />
            {formatDate(lead.createdAt)}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a href={`mailto:${lead.email}`} className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800/30 hover:bg-zinc-800/50 transition-colors group">
            <Mail className="w-4 h-4 text-zinc-500 group-hover:text-gold transition-colors" />
            <span className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">{lead.email}</span>
          </a>
          {lead.phone && (
            <a href={`tel:${lead.phone}`} className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800/30 hover:bg-zinc-800/50 transition-colors group">
              <Phone className="w-4 h-4 text-zinc-500 group-hover:text-gold transition-colors" />
              <span className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">{lead.phone}</span>
            </a>
          )}
        </div>

        {lead.message && (
          <div className="px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800/30">
            <p className="text-xs text-zinc-500 mb-1.5 font-medium uppercase tracking-wider">Сообщение</p>
            <p className="text-sm text-zinc-300 whitespace-pre-wrap">{lead.message}</p>
          </div>
        )}

        {lead.sourcePage && (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Globe className="w-3 h-3" aria-hidden="true" />
            Источник: {lead.sourcePage}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════
          Status controls
         ═══════════════════════════════════════ */}
      <section className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-6 space-y-4">
        <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-zinc-500" />
          Статус заявки
        </h3>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleStatusChange(opt.value)}
              disabled={lead.status === opt.value || changingStatus === opt.value}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
                lead.status === opt.value
                  ? 'bg-gold/10 border-gold/20 text-gold cursor-default'
                  : 'bg-zinc-900/50 border-zinc-800/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700/50'
              } disabled:opacity-50`}
            >
              {changingStatus === opt.value && <Loader2 className="w-3 h-3 animate-spin" />}
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          Notes / Timeline
         ═══════════════════════════════════════ */}
      <section className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800/50">
          <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <History className="w-4 h-4 text-zinc-500" />
            История
          </h3>
        </div>

        {/* Add note */}
        <div className="px-6 py-4 border-b border-zinc-800/30">
          <div className="flex gap-3">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Добавить нотатку..."
              rows={2}
              className="flex-1 bg-zinc-900/70 border border-zinc-800/50 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all duration-200 resize-none"
            />
            <button
              type="button"
              onClick={handleAddNote}
              disabled={!noteText.trim() || savingNote}
              className="self-end px-4 py-2 rounded-lg bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {savingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Добавить'}
            </button>
          </div>
        </div>

        {/* Events timeline */}
        <div className="px-6 py-4 space-y-3 max-h-[400px] overflow-y-auto">
          {lead.events.length > 0 ? (
            lead.events.map((event) => {
              const cfg = EVENT_TYPE_CONFIG[event.type] ?? { label: event.type, color: 'text-zinc-500' }
              return (
                <div key={event.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${cfg.color.replace('text-', 'bg-')}`} />
                    <div className="w-px flex-1 bg-zinc-800/30 mt-1" />
                  </div>
                  <div className="flex-1 pb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                      <span className="text-[10px] text-zinc-600">
                        {formatDate(event.createdAt)}
                      </span>
                    </div>
                    {event.note && (
                      <p className="text-sm text-zinc-400 mt-1">{event.note}</p>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <p className="text-sm text-zinc-600 text-center py-4">Нет событий</p>
          )}
          {lead.events.length > 0 && (
            <div className="flex gap-3">
              <div className="w-2 h-2 rounded-full mt-1.5 bg-zinc-700" />
              <p className="text-xs text-zinc-600">Заявка создана</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          Delete
         ═══════════════════════════════════════ */}
      <div className="flex justify-end">
        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-red-900/20 text-red-400 border border-red-800/30 hover:bg-red-900/30"
          >
            <Trash2 className="w-4 h-4" /> Удалить заявку
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
      </div>
    </div>
  )
}
