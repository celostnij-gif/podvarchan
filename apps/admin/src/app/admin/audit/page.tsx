import { getAuditLogs, getAuditLogsCount, getAuditEntityTypes, getAuditActions } from '@/lib/actions/audit'
import { AuditLogTable } from './audit-table'
import { AuditFilters } from './audit-filters'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ entityType?: string; userId?: string; action?: string; offset?: string }>
}

export default async function AuditPage(props: Props) {
  const sp = await props.searchParams
  const offset = sp.offset ? parseInt(sp.offset) : 0
  const filters = { entityType: sp.entityType, userId: sp.userId, action: sp.action }
  const [logs, totalCount, entityTypes, actions] = await Promise.all([
    getAuditLogs({ ...filters, offset }),
    getAuditLogsCount(filters),
    getAuditEntityTypes(),
    getAuditActions(),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Аудит</h1>
      <p className="text-sm text-zinc-500">
        Журнал дій адміністраторів та редакторів. Записів: {totalCount}
      </p>
      <AuditFilters entityTypes={entityTypes} actions={actions} />
      <AuditLogTable logs={logs} offset={offset} totalCount={totalCount} />
    </div>
  )
}
