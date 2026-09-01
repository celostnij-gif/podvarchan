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
        <div key={r.id} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
          <div className="flex items-center gap-3 mb-2 text-sm flex-wrap">
            <span className="text-xs text-zinc-500">
              {r.createdAt ? new Date(r.createdAt).toLocaleString('uk-UA') : '—'}
            </span>
            {r.label && (
              <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400 border border-zinc-700/50">{r.label}</span>
            )}
            {r.locale && (
              <span className="rounded bg-blue-900/30 text-blue-400 border border-blue-700/30 px-1.5 py-0.5 text-xs">{r.locale === 'ru' ? '🇷🇺 RU' : '🇺🇦 UK'}</span>
            )}
            {r.createdById && (
              <span className="text-xs text-zinc-600">автор: {r.createdById.slice(0, 8)}…</span>
            )}
          </div>

          {r.dataJson && (
            <details>
              <summary className="cursor-pointer text-xs text-amber-500 hover:text-amber-400 mb-1">
                Дані ревізії
              </summary>
              <pre className="text-[10px] rounded-lg bg-zinc-950 border border-zinc-800 p-2 overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap break-all text-zinc-400">
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
