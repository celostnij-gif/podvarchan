'use client'

import { useState, useMemo } from 'react'
import type { SeoUrlRow } from '@/lib/seo/audit'
import { scoreColorClass, scoreLabel } from '@/lib/seo/audit'
import { CsvExportButton } from './csv-button'

interface Props {
  rows: SeoUrlRow[]
  avgScore: number
  green: number
  yellow: number
  red: number
}

export function SeoAuditClient({ rows, avgScore, green, yellow, red }: Props) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [scoreFilter, setScoreFilter] = useState<'all' | 'green' | 'yellow' | 'red'>('all')

  const entityTypes = useMemo(() => ['all', ...Array.from(new Set(rows.map((r) => r.entityType)))], [rows])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const q = search.trim().toLowerCase()
      if (q && !r.url.toLowerCase().includes(q) && !(r.title ?? '').toLowerCase().includes(q)) return false
      if (typeFilter !== 'all' && r.entityType !== typeFilter) return false
      if (scoreFilter === 'green' && r.score < 40) return false
      if (scoreFilter === 'yellow' && (r.score < 20 || r.score >= 40)) return false
      if (scoreFilter === 'red' && r.score >= 20) return false
      return true
    })
  }, [rows, search, typeFilter, scoreFilter])

  const total = rows.length

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">SEO Аудит</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {total} URL · Середній бал: {avgScore}/50
          </p>
        </div>
        <CsvExportButton />
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <button
          onClick={() => setScoreFilter(scoreFilter === 'green' ? 'all' : 'green')}
          className={`rounded-lg border p-4 text-left transition-all ${scoreFilter === 'green' ? 'border-green-600/60 bg-green-900/40 ring-1 ring-green-600/30' : 'border-green-800/40 bg-green-900/20 hover:border-green-700/60'}`}
        >
          <p className="text-2xl font-bold text-green-400">{green}</p>
          <p className="text-sm text-green-500">Добре (40–50)</p>
        </button>
        <button
          onClick={() => setScoreFilter(scoreFilter === 'yellow' ? 'all' : 'yellow')}
          className={`rounded-lg border p-4 text-left transition-all ${scoreFilter === 'yellow' ? 'border-yellow-600/60 bg-yellow-900/40 ring-1 ring-yellow-600/30' : 'border-yellow-800/40 bg-yellow-900/20 hover:border-yellow-700/60'}`}
        >
          <p className="text-2xl font-bold text-yellow-400">{yellow}</p>
          <p className="text-sm text-yellow-500">Треба покращити (20–39)</p>
        </button>
        <button
          onClick={() => setScoreFilter(scoreFilter === 'red' ? 'all' : 'red')}
          className={`rounded-lg border p-4 text-left transition-all ${scoreFilter === 'red' ? 'border-red-600/60 bg-red-900/40 ring-1 ring-red-600/30' : 'border-red-800/40 bg-red-900/20 hover:border-red-700/60'}`}
        >
          <p className="text-2xl font-bold text-red-400">{red}</p>
          <p className="text-sm text-red-500">Погано (0–19)</p>
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Пошук за URL або заголовком…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
        >
          {entityTypes.map((t) => (
            <option key={t} value={t}>{t === 'all' ? 'Всі типи' : t}</option>
          ))}
        </select>
        {(search || typeFilter !== 'all' || scoreFilter !== 'all') && (
          <button
            onClick={() => { setSearch(''); setTypeFilter('all'); setScoreFilter('all') }}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Скинути фільтри
          </button>
        )}
        <span className="text-xs text-zinc-600">{filtered.length} з {total}</span>
      </div>

      {/* Audit table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <table className="min-w-full divide-y divide-zinc-800 text-sm">
          <thead className="bg-zinc-800/30">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">URL</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Тип</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Заголовок</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Опис</th>
              <th className="px-4 py-3 text-center font-medium text-zinc-500">Бал</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Проблеми</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-500">
                  За вашим запитом нічого не знайдено
                </td>
              </tr>
            ) : filtered.map((row) => (
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
                        <li className="text-zinc-600">+{row.warnings.length - 2} більше</li>
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
