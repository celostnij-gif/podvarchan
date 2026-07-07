import { getRevisions } from '@/app/admin/actions/audit'
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
      <h1 className="text-2xl font-bold">Ревізії</h1>
      <p className="text-sm text-gray-500">
        Тип: <code className="bg-gray-100 px-1 rounded">{entityType}</code>
        {' / '}
        ID: <code className="bg-gray-100 px-1 rounded">{entityId}</code>
      </p>
      {revisions.length === 0 ? (
        <p className="text-sm text-gray-400">Немає ревізій для цієї сутності</p>
      ) : (
        <RevisionsList revisions={revisions} />
      )}
    </div>
  )
}
