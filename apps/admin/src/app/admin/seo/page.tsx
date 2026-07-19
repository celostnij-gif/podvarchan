import { getSeoAudit } from '@/lib/actions/seo'
import { computeAuditSummary } from '@/lib/seo/audit'
import { SeoAuditClient } from './seo-audit-client'

export const dynamic = 'force-dynamic'

export default async function SeoAuditPage() {
  const rows = await getSeoAudit()
  const summary = computeAuditSummary(rows)

  return (
    <SeoAuditClient
      rows={rows}
      avgScore={summary.avgScore}
      green={summary.green}
      yellow={summary.yellow}
      red={summary.red}
    />
  )
}
