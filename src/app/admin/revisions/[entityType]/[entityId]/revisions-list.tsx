'use client'

import type { InferSelectModel } from 'drizzle-orm'
import type { contentRevisions as revSchema } from '@/db/schema/revisions'

type Revision = InferSelectModel<typeof revSchema>

interface Props {
  revisions: Revision[]
}

export function RevisionsList({ revisions }: Props) {
  return (
    <div className="space-y-3">
      {revisions.map((r) => (
        <div key={r.id} className="border rounded p-3">
          <div className="flex items-center gap-3 mb-2 text-sm">
            <span className="text-xs text-gray-500">
              {r.createdAt ? new Date(r.createdAt).toLocaleString('uk') : '-'}
            </span>
            {r.label && (
              <span className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{r.label}</span>
            )}
            {r.locale && (
              <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs">{r.locale}</span>
            )}
            {r.createdById && (
              <span className="text-xs text-gray-400">by {r.createdById.slice(0, 8)}</span>
            )}
          </div>

          {r.dataJson && (
            <details>
              <summary className="cursor-pointer text-blue-600 hover:underline text-xs mb-1">
                Дані ревізії
              </summary>
              <pre className="text-[10px] bg-gray-50 p-2 rounded overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap break-all">
                {formatJson(r.dataJson)}
              </pre>
            </details>
          )}
        </div>
      ))}
    </div>
  )
}

function formatJson(json: string): string {
  try {
    return JSON.stringify(JSON.parse(json), null, 2)
  } catch {
    return json
  }
}
