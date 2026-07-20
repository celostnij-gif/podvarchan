'use client'

import Link from 'next/link'
import { useState } from 'react'
import { getAuditLogDetail } from '@/lib/actions/audit'

type AuditRow = {
  id: string
  userId: string | null
  action: string
  entityType: string | null
  entityId: string | null
  ip: string | null
  createdAt: string
}

interface Props {
  logs: AuditRow[]
  offset: number
  totalCount: number
}

const PAGE_SIZE = 50

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Створення',
  UPDATE: 'Оновлення',
  DELETE: 'Видалення',
  PUBLISH: 'Публікація',
  ARCHIVE: 'Архівація',
  LOGIN: 'Вхід',
  LOGOUT: 'Вихід',
}

export function AuditLogTable({ logs, offset, totalCount }: Props) {
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1

  return (
    <div>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-zinc-800">
            <th className="text-left p-2 border border-zinc-700 text-zinc-200">Дата</th>
            <th className="text-left p-2 border border-zinc-700 text-zinc-200">Дія</th>
            <th className="text-left p-2 border border-zinc-700 text-zinc-200">Тип</th>
            <th className="text-left p-2 border border-zinc-700 text-zinc-200">ID</th>
            <th className="text-left p-2 border border-zinc-700 text-zinc-200">Користувач</th>
            <th className="text-left p-2 border border-zinc-700 text-zinc-200">Деталі</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 && (
            <tr>
              <td colSpan={6} className="p-4 text-center text-zinc-500">Немає записів</td>
            </tr>
          )}
          {logs.map((row) => (
            <AuditRow key={row.id} row={row} />
          ))}
        </tbody>
      </table>

      <div className="flex justify-between items-center mt-4">
        <span className="text-xs text-zinc-500">
          Сторінка {currentPage} з {totalPages || 1}
        </span>
        <div className="flex gap-2">
          <Link
            href={offset > 0 ? `?offset=${Math.max(0, offset - PAGE_SIZE)}` : '#'}
            className={`px-3 py-1 rounded text-sm border border-zinc-700 ${offset === 0 ? 'text-zinc-600 pointer-events-none' : 'text-zinc-300 hover:bg-zinc-800'}`}
          >
            ← Попередня
          </Link>
          <Link
            href={offset + PAGE_SIZE < totalCount ? `?offset=${offset + PAGE_SIZE}` : '#'}
            className={`px-3 py-1 rounded text-sm border border-zinc-700 ${offset + PAGE_SIZE >= totalCount ? 'text-zinc-600 pointer-events-none' : 'text-zinc-300 hover:bg-zinc-800'}`}
          >
            Наступна →
          </Link>
        </div>
      </div>
    </div>
  )
}

function AuditRow({ row }: { row: AuditRow }) {
  const [expanded, setExpanded] = useState(false)
  const [detail, setDetail] = useState<{ beforeJson: string | null; afterJson: string | null } | null>(null)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (expanded) { setExpanded(false); return }
    if (!detail) {
      setLoading(true)
      try {
        const d = await getAuditLogDetail(row.id)
        setDetail(d ? { beforeJson: d.beforeJson, afterJson: d.afterJson } : null)
      } catch { setDetail(null) }
      setLoading(false)
    }
    setExpanded(true)
  }

  return (
    <>
      <tr className="hover:bg-zinc-800/30">
        <td className="p-2 border border-zinc-700 text-xs whitespace-nowrap text-zinc-300">
          {row.createdAt ? new Date(row.createdAt).toLocaleString('uk') : '-'}
        </td>
        <td className="p-2 border border-zinc-700">
          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
            row.action === 'DELETE' ? 'bg-red-900/30 text-red-400 border border-red-700/30' :
            row.action === 'CREATE' ? 'bg-green-900/30 text-green-400 border border-green-700/30' :
            'bg-blue-900/30 text-blue-400 border border-blue-700/30'
          }`}>
            {ACTION_LABELS[row.action] ?? row.action}
          </span>
        </td>
        <td className="p-2 border border-zinc-700 text-xs text-zinc-300">{row.entityType}</td>
        <td className="p-2 border border-zinc-700 text-xs max-w-[120px] truncate font-mono text-zinc-300">{row.entityId}</td>
        <td className="p-2 border border-zinc-700 text-xs max-w-xs text-zinc-300">{row.userId ? row.userId.slice(0, 8) : '-'}</td>
        <td className="p-2 border border-zinc-700 text-xs">
          <button onClick={toggle} className="text-amber-500 hover:underline text-xs">
            {loading ? 'Завантаження...' : expanded ? 'Згорнути' : 'Розгорнути'}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} className="px-4 py-2 border border-zinc-700 bg-zinc-900/50">
            {detail?.afterJson && (
              <div className="mb-2">
                <span className="text-xs font-medium text-zinc-400">after:</span>
                <pre className="mt-1 text-[10px] bg-zinc-800/50 p-1 rounded overflow-x-auto max-h-24 overflow-y-auto whitespace-pre-wrap break-all text-zinc-300">
                  {truncateJson(detail.afterJson)}
                </pre>
              </div>
            )}
            {detail?.beforeJson && (
              <div>
                <span className="text-xs font-medium text-zinc-400">before:</span>
                <pre className="mt-1 text-[10px] bg-zinc-800/50 p-1 rounded overflow-x-auto max-h-24 overflow-y-auto whitespace-pre-wrap break-all text-zinc-300">
                  {truncateJson(detail.beforeJson)}
                </pre>
              </div>
            )}
            {!detail?.beforeJson && !detail?.afterJson && (
              <span className="text-zinc-500 text-xs">Немає деталей</span>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

function truncateJson(json: string): string {
  try {
    const parsed = JSON.parse(json)
    if (typeof parsed === 'object' && parsed !== null) {
      const entries = Object.entries(parsed)
      if (entries.length > 10) {
        const shown = entries.slice(0, 10)
        return JSON.stringify(Object.fromEntries(shown), null, 2) + `\n... (+${entries.length - 10} keys)`
      }
    }
    return JSON.stringify(parsed, null, 2)
  } catch {
    return json.length > 500 ? json.slice(0, 500) + '...' : json
  }
}
