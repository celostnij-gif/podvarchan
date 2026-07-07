import { getAuditLogs, getAuditEntityTypes, getAuditActions } from '@/app/admin/actions/audit'
import { AuditLogTable } from './audit-table'
import { AuditFilters } from './audit-filters'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ entityType?: string; userId?: string; action?: string; offset?: string }>
}

export default async function AuditPage(props: Props) {
  const sp = await props.searchParams
  const [logs, entityTypes, actions] = await Promise.all([
    getAuditLogs({
      entityType: sp.entityType,
      userId: sp.userId,
      action: sp.action,
      offset: sp.offset ? parseInt(sp.offset) : 0,
    }),
    getAuditEntityTypes(),
    getAuditActions(),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Аудит</h1>
      <p className="text-sm text-gray-500">
        Журнал дій адміністраторів та редакторів.
      </p>
      <AuditFilters entityTypes={entityTypes} actions={actions} />
      <AuditLogTable logs={logs} offset={sp.offset ? parseInt(sp.offset) : 0} />
    </div>
  )
}
