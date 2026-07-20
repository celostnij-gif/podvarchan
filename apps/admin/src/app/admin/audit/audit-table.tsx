'use client'

import Link from 'next/link'
import type { InferSelectModel } from 'drizzle-orm'
import type { auditLogs as auditSchema } from '@/db/schema/auth'

type AuditRow = InferSelectModel<typeof auditSchema>

interface Props {
  logs: AuditRow[]
  offset: number
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

export function AuditLogTable({ logs, offset }: Props) {
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
            <tr key={row.id} className="hover:bg-zinc-800/30">
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
              <td className="p-2 border text-xs max-w-xs">
                {row.afterJson && (
                  <details>
                    <summary className="cursor-pointer text-amber-500 hover:underline">after</summary>
                    <pre className="mt-1 text-[10px] bg-zinc-800/50 p-1 rounded overflow-x-auto max-h-24 overflow-y-auto whitespace-pre-wrap break-all text-zinc-300">
                      {truncateJson(row.afterJson)}
                    </pre>
                  </details>
                )}
                {row.beforeJson && (
                  <details>
                    <summary className="cursor-pointer text-amber-500 hover:underline">before</summary>
                    <pre className="mt-1 text-[10px] bg-zinc-800/50 p-1 rounded overflow-x-auto max-h-24 overflow-y-auto whitespace-pre-wrap break-all text-zinc-300">
                      {truncateJson(row.beforeJson)}
                    </pre>
                  </details>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between mt-4">
        <Link
          href={offset > 0 ? `?offset=${Math.max(0, offset - PAGE_SIZE)}` : '#'}
          className={`px-3 py-1 rounded text-sm border border-zinc-700 ${offset === 0 ? 'text-zinc-600 pointer-events-none' : 'text-zinc-300 hover:bg-zinc-800'}`}
        >
          ← Попередня
        </Link>
        <Link
          href={logs.length === PAGE_SIZE ? `?offset=${offset + PAGE_SIZE}` : '#'}
          className={`px-3 py-1 rounded text-sm border border-zinc-700 ${logs.length < PAGE_SIZE ? 'text-zinc-600 pointer-events-none' : 'text-zinc-300 hover:bg-zinc-800'}`}
        >
          Наступна →
        </Link>
      </div>
    </div>
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
