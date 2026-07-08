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
          <h1 className="text-2xl font-bold text-gray-900">SEO Аудит</h1>
          <p className="mt-1 text-sm text-gray-500">
            {summary.total} URL · Average score: {summary.avgScore}/50
          </p>
        </div>
        <CsvExportButton />
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-2xl font-bold text-green-700">{summary.green}</p>
          <p className="text-sm text-green-600">Good (40-50)</p>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-2xl font-bold text-yellow-700">{summary.yellow}</p>
          <p className="text-sm text-yellow-600">Needs work (20-39)</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-2xl font-bold text-red-700">{summary.red}</p>
          <p className="text-sm text-red-600">Poor (0-19)</p>
        </div>
      </div>

      {/* Audit table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">URL</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Type</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Title</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Description</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">Score</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Issues</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.url} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {row.url}
                  </a>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{row.entityType}</td>
                <td className="max-w-[200px] truncate px-4 py-3 text-xs" title={row.title ?? ''}>
                  {row.title ?? <span className="italic text-gray-400">—</span>}
                </td>
                <td className="max-w-[250px] truncate px-4 py-3 text-xs" title={row.description ?? ''}>
                  {row.description ?? <span className="italic text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${scoreColorClass(row.score)}`}>
                    {row.score}/50 · {scoreLabel(row.score)}
                  </span>
                </td>
                <td className="max-w-[200px] px-4 py-3 text-xs">
                  {row.warnings.length > 0 ? (
                    <ul className="list-inside list-disc text-red-600">
                      {row.warnings.slice(0, 2).map((w, i) => (
                        <li key={i} className="truncate" title={w}>{w}</li>
                      ))}
                      {row.warnings.length > 2 && (
                        <li className="text-gray-400">+{row.warnings.length - 2} more</li>
                      )}
                    </ul>
                  ) : (
                    <span className="text-green-600">OK</span>
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
