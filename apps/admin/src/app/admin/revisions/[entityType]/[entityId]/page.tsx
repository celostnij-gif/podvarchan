import { getRevisions } from '@/lib/actions/audit'
import { RevisionsList } from './revisions-list'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ entityType: string; entityId: string }>
}

export default async function RevisionsPage(props: Props) {
  const { entityType, entityId } = await props.params
  const revisions = await getRevisions(entityType, entityId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Ревізії</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Тип: <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400">{entityType}</code>
          {' / '}
          ID: <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400">{entityId.slice(0, 12)}…</code>
        </p>
      </div>
      {revisions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-800 py-8 text-center text-sm text-zinc-500">
          Ревізій ще немає для цієї сутності
        </p>
      ) : (
        <RevisionsList revisions={revisions} />
      )}
    </div>
  )
}
