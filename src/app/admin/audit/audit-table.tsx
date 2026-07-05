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
          <tr className="bg-gray-100">
            <th className="text-left p-2 border">Дата</th>
            <th className="text-left p-2 border">Дія</th>
            <th className="text-left p-2 border">Тип</th>
            <th className="text-left p-2 border">ID</th>
            <th className="text-left p-2 border">Користувач</th>
            <th className="text-left p-2 border">Деталі</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 && (
            <tr>
              <td colSpan={6} className="p-4 text-center text-gray-400">Немає записів</td>
            </tr>
          )}
          {logs.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              <td className="p-2 border text-xs whitespace-nowrap">
                {row.createdAt ? new Date(row.createdAt).toLocaleString('uk') : '-'}
              </td>
              <td className="p-2 border">
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                  row.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                  row.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {ACTION_LABELS[row.action] ?? row.action}
                </span>
              </td>
              <td className="p-2 border text-xs">{row.entityType}</td>
              <td className="p-2 border text-xs max-w-[120px] truncate font-mono">{row.entityId}</td>
              <td className="p-2 border text-xs">{row.userId ? row.userId.slice(0, 8) : '-'}</td>
              <td className="p-2 border text-xs max-w-xs">
                {row.afterJson && (
                  <details>
                    <summary className="cursor-pointer text-blue-600 hover:underline">after</summary>
                    <pre className="mt-1 text-[10px] bg-gray-50 p-1 rounded overflow-x-auto max-h-24 overflow-y-auto whitespace-pre-wrap break-all">
                      {truncateJson(row.afterJson)}
                    </pre>
                  </details>
                )}
                {row.beforeJson && (
                  <details>
                    <summary className="cursor-pointer text-orange-600 hover:underline">before</summary>
                    <pre className="mt-1 text-[10px] bg-gray-50 p-1 rounded overflow-x-auto max-h-24 overflow-y-auto whitespace-pre-wrap break-all">
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
          className={`px-3 py-1 rounded text-sm border ${offset === 0 ? 'text-gray-300 pointer-events-none' : 'hover:bg-gray-100'}`}
        >
          ← Попередня
        </Link>
        <Link
          href={logs.length === PAGE_SIZE ? `?offset=${offset + PAGE_SIZE}` : '#'}
          className={`px-3 py-1 rounded text-sm border ${logs.length < PAGE_SIZE ? 'text-gray-300 pointer-events-none' : 'hover:bg-gray-100'}`}
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
