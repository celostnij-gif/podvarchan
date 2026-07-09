import { getSeoAudit } from '@/lib/actions/seo'
import { computeAuditSummary, scoreColorClass, scoreLabel } from '@/lib/seo/audit'
import { CsvExportButton } from './csv-button'

export const dynamic = 'force-dynamic'

export default async function SeoAuditPage() {
  const rows = await getSeoAudit()
  const summary = computeAuditSummary(rows)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">SEO Аудит</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {summary.total} URL · Average score: {summary.avgScore}/50
          </p>
        </div>
        <CsvExportButton />
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-green-800/40 bg-green-900/20 p-4">
          <p className="text-2xl font-bold text-green-400">{summary.green}</p>
          <p className="text-sm text-green-500">Good (40-50)</p>
        </div>
        <div className="rounded-lg border border-yellow-800/40 bg-yellow-900/20 p-4">
          <p className="text-2xl font-bold text-yellow-400">{summary.yellow}</p>
          <p className="text-sm text-yellow-500">Needs work (20-39)</p>
        </div>
        <div className="rounded-lg border border-red-800/40 bg-red-900/20 p-4">
          <p className="text-2xl font-bold text-red-400">{summary.red}</p>
          <p className="text-sm text-red-500">Poor (0-19)</p>
        </div>
      </div>

      {/* Audit table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <table className="min-w-full divide-y divide-zinc-800 text-sm">
          <thead className="bg-zinc-800/30">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">URL</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Type</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Title</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Description</th>
              <th className="px-4 py-3 text-center font-medium text-zinc-500">Score</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Issues</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {rows.map((row) => (
              <tr key={row.url} className="hover:bg-zinc-800/30">
                <td className="px-4 py-3">
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-amber-400 hover:text-amber-300 hover:underline"
                  >
                    {row.url}
                  </a>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500">{row.entityType}</td>
                <td className="max-w-[200px] truncate px-4 py-3 text-xs text-zinc-400" title={row.title ?? ''}>
                  {row.title ?? <span className="italic text-zinc-600">—</span>}
                </td>
                <td className="max-w-[250px] truncate px-4 py-3 text-xs text-zinc-400" title={row.description ?? ''}>
                  {row.description ?? <span className="italic text-zinc-600">—</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${scoreColorClass(row.score)}`}>
                    {row.score}/50 · {scoreLabel(row.score)}
                  </span>
                </td>
                <td className="max-w-[200px] px-4 py-3 text-xs">
                  {row.warnings.length > 0 ? (
                    <ul className="list-inside list-disc text-red-400">
                      {row.warnings.slice(0, 2).map((w, i) => (
                        <li key={i} className="truncate" title={w}>{w}</li>
                      ))}
                      {row.warnings.length > 2 && (
                        <li className="text-zinc-600">+{row.warnings.length - 2} more</li>
                      )}
                    </ul>
                  ) : (
                    <span className="text-green-400">OK</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
