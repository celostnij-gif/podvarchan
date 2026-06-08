'use client'

import { useEffect, useState, useCallback } from 'react'
import { Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { getAuditLogs } from '@/lib/actions/audit'
import type { AuditLogFilter } from '@/lib/actions/audit'

/* ── Types ── */

interface AuditEntry {
  log: {
    id: string
    userId: string
    action: string
    entityType: string
    entityId: string | null
    beforeJson: string | null
    afterJson: string | null
    ip: string | null
    userAgent: string | null
    createdAt: Date
  }
  user: { id: string; name: string | null; email: string | null } | null
}

/* ── Action colors ── */

const ACTION_STYLES: Record<string, string> = {
  CREATE: 'bg-emerald-900/30 text-emerald-400',
  UPDATE: 'bg-blue-900/30 text-blue-400',
  DELETE: 'bg-red-900/30 text-red-400',
  PUBLISH: 'bg-amber-900/30 text-amber-400',
  UNPUBLISH: 'bg-orange-900/30 text-orange-400',
  LOGIN: 'bg-purple-900/30 text-purple-400',
  LOGOUT: 'bg-zinc-800/50 text-zinc-400',
  UPLOAD: 'bg-cyan-900/30 text-cyan-400',
  SETTINGS_CHANGE: 'bg-pink-900/30 text-pink-400',
}

/* ── Component ── */

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<AuditLogFilter>({ limit: 50 })
  const [showFilters, setShowFilters] = useState(false)

  const load = useCallback(async () => {
    setError('')
    const result = await getAuditLogs(filter)
    if ('data' in result) {
      setEntries(result.data!)
    } else {
      setError(result.error ?? 'Ошибка загрузки')
    }
  }, [filter])

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true)
      load().then(() => setLoading(false))
    }, 0)
    return () => clearTimeout(timer)
  }, [load])

  const ACTION_LABELS: Record<string, string> = {
    CREATE: 'Создание', UPDATE: 'Изменение', DELETE: 'Удаление',
    PUBLISH: 'Публикация', UNPUBLISH: 'Снятие с публикации',
    LOGIN: 'Вход', LOGOUT: 'Выход', UPLOAD: 'Загрузка',
    SETTINGS_CHANGE: 'Изменение настроек',
  }

  const ENTITY_LABELS: Record<string, string> = {
    SERVICE: 'Услуга', BLOG_POST: 'Статья', FAQ_ITEM: 'FAQ',
    TESTIMONIAL: 'Отзыв', LEAD: 'Заявка', MEDIA: 'Медиа',
    NAV_ITEM: 'Навигация', REDIRECT: 'Редирект',
    SETTINGS: 'Настройки', USER: 'Пользователь',
    CONTACT_CHANNEL: 'Контактный канал', PAGE: 'Страница',
  }

  function formatEntity(entityType: string): string {
    return ENTITY_LABELS[entityType] ?? entityType
  }

  function formatDate(date: Date | string): string {
    return new Date(date).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  function tryParseJson(str: string | null): unknown {
    if (!str) return null
    try { return JSON.parse(str) } catch { return str }
  }

  /* ── Render ── */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Журнал действий</h1>
          <p className="text-sm text-zinc-500 mt-1">Все действия администраторов в хронологическом порядке</p>
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900/50 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-all text-sm"
        >
          <Filter className="w-4 h-4" />
          Фильтры
          {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="p-4 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Действие</label>
              <select value={filter.action ?? ''} onChange={e => setFilter(f => ({ ...f, action: e.target.value || undefined }))}
                className="w-full px-3 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700 text-zinc-200 text-sm"
              >
                <option value="">Все действия</option>
                {Object.entries(ACTION_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Сущность</label>
              <select value={filter.entityType ?? ''} onChange={e => setFilter(f => ({ ...f, entityType: e.target.value || undefined }))}
                className="w-full px-3 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700 text-zinc-200 text-sm"
              >
                <option value="">Все сущности</option>
                {Object.entries(ENTITY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Записей</label>
              <select value={filter.limit ?? 50} onChange={e => setFilter(f => ({ ...f, limit: parseInt(e.target.value) || 50 }))}
                className="w-full px-3 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700 text-zinc-200 text-sm"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          <button onClick={() => load()}
            className="px-4 py-2 rounded-xl bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 text-sm transition-all"
          >
            Применить
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-12">
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={() => load()} className="mt-3 text-gold text-sm hover:underline">Повторить</button>
        </div>
      )}

      {/* List */}
      {!error && entries.length === 0 && (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl">
          <p className="text-zinc-600 text-sm">Нет записей в журнале</p>
        </div>
      )}

      {!error && entries.length > 0 && (
        <div className="space-y-2">
          {entries.map(entry => (
            <div key={entry.log.id} className="rounded-xl bg-zinc-900/30 border border-zinc-800/50 overflow-hidden">
              {/* Summary row */}
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-900/50 transition-colors"
                onClick={() => setExpandedId(expandedId === entry.log.id ? null : entry.log.id)}
              >
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${ACTION_STYLES[entry.log.action] ?? 'bg-zinc-800/50 text-zinc-400'}`}>
                  {entry.log.action}
                </span>
                <span className="text-xs text-zinc-600 font-mono">{formatEntity(entry.log.entityType)}</span>
                {entry.log.entityId && (
                  <span className="text-xs text-zinc-700 font-mono hidden sm:inline truncate max-w-[120px]">{entry.log.entityId}</span>
                )}
                <div className="flex-1" />
                <div className="flex items-center gap-2 text-xs text-zinc-600">
                  {entry.user && (
                    <span className="hidden md:inline">{entry.user.name ?? entry.user.email}</span>
                  )}
                  <span>{formatDate(entry.log.createdAt)}</span>
                </div>
                {expandedId === entry.log.id ? <ChevronUp className="w-3.5 h-3.5 text-zinc-600" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-600" />}
              </div>

              {/* Expanded detail */}
              {expandedId === entry.log.id && (
                <div className="px-4 pb-4 border-t border-zinc-800/50 pt-3 space-y-3">
                  {/* Metadata */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <p className="text-zinc-600">Пользователь</p>
                      <p className="text-zinc-300">{entry.user?.name ?? entry.user?.email ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-zinc-600">IP</p>
                      <p className="text-zinc-300 font-mono">{entry.log.ip ?? '—'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-zinc-600">User-Agent</p>
                      <p className="text-zinc-300 font-mono text-[10px] break-all">{entry.log.userAgent ?? '—'}</p>
                    </div>
                  </div>

                  {/* Before / After JSON */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {entry.log.beforeJson && (
                      <div>
                        <p className="text-xs font-medium text-zinc-500 mb-1">До (Before)</p>
                        <pre className="text-xs text-zinc-400 bg-zinc-900/50 rounded-lg p-2 overflow-x-auto max-h-32 font-mono">
                          {JSON.stringify(tryParseJson(entry.log.beforeJson), null, 2)}
                        </pre>
                      </div>
                    )}
                    {entry.log.afterJson && (
                      <div>
                        <p className="text-xs font-medium text-zinc-500 mb-1">После (After)</p>
                        <pre className="text-xs text-zinc-400 bg-zinc-900/50 rounded-lg p-2 overflow-x-auto max-h-32 font-mono">
                          {JSON.stringify(tryParseJson(entry.log.afterJson), null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
