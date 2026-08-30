'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { InferSelectModel } from 'drizzle-orm'
import type { contentRevisions as revSchema } from '@/db/schema/revisions'
import { restoreRevision } from '@/lib/actions/revisions'
import ConfirmDialog from '@/components/admin/ConfirmDialog'

type Revision = InferSelectModel<typeof revSchema>

interface Props {
  revisions: Revision[]
}

export function RevisionsList({ revisions }: Props) {
  const router = useRouter()
  const [pendingRevision, setPendingRevision] = useState<Revision | null>(null)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null)

  async function handleRestore() {
    if (!pendingRevision) return
    setBusy(true)
    setFeedback(null)
    try {
      await restoreRevision(pendingRevision.id)
      setFeedback({ ok: true, text: 'Стан відновлено. Поточний стан збережено як окрему ревізію.' })
    } catch (err) {
      setFeedback({ ok: false, text: err instanceof Error ? err.message : 'Помилка відновлення' })
    } finally {
      setBusy(false)
      setPendingRevision(null)
      router.refresh()
    }
  }

  return (
    <div className="space-y-3">
      {feedback && (
        <p className={`rounded-lg border px-3 py-2 text-sm ${feedback.ok ? 'border-green-700/50 bg-green-900/20 text-green-400' : 'border-red-700/50 bg-red-900/20 text-red-400'}`}>
          {feedback.text}
        </p>
      )}
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

          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setPendingRevision(r)}
              className="rounded-md bg-amber-600/20 px-2.5 py-1 text-xs font-medium text-amber-400 hover:bg-amber-600/30 transition-colors"
            >
              Відновити цей стан
            </button>
          </div>
        </div>
      ))}

      <ConfirmDialog
        open={pendingRevision !== null}
        title="Відновити стан сутності?"
        message={
          pendingRevision
            ? `Дані сутності будуть перезаписані станом ревізії від ${new Date(pendingRevision.createdAt).toLocaleString('uk-UA')}. Поточний стан збережеться окремою ревізією (скасувати можна).`
            : ''
        }
        confirmLabel={busy ? 'Відновлення…' : 'Відновити'}
        variant="warning"
        onConfirm={handleRestore}
        onCancel={() => setPendingRevision(null)}
      />
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