import { getDB } from '@/db'
import { contactLeads } from '@/db/schema/leads'
import { desc, eq, and, or, like, gte, lte } from 'drizzle-orm'
import Link from 'next/link'
import { DeleteButton } from './delete-button'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ status?: string; q?: string; from?: string; to?: string }>
}

const statusConfig: Record<string, { label: string; color: string }> = {
  NEW: { label: 'Нова', color: 'bg-blue-900/30 text-blue-400 border border-blue-700/30' },
  IN_PROGRESS: { label: 'В роботі', color: 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/30' },
  CONTACTED: { label: "Зв'язались", color: 'bg-purple-900/30 text-purple-400 border border-purple-700/30' },
  BOOKED: { label: 'Записані', color: 'bg-green-900/30 text-green-400 border border-green-700/30' },
  CLOSED: { label: 'Закрита', color: 'bg-zinc-800 text-zinc-400 border border-zinc-700/50' },
  SPAM: { label: 'Спам', color: 'bg-red-900/30 text-red-400 border border-red-700/30' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? { label: status, color: 'bg-zinc-800 text-zinc-400 border border-zinc-700/50' }
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

export default async function LeadsListPage(props: Props) {
  const params = await props.searchParams
  const db = getDB()

  const conditions = []
  if (params.status && params.status !== 'all') {
    conditions.push(eq(contactLeads.status, params.status as 'NEW' | 'IN_PROGRESS' | 'CONTACTED' | 'BOOKED' | 'CLOSED' | 'SPAM'))
  }
  if (params.q) {
    const q = `%${params.q}%`
    conditions.push(
      or(
        like(contactLeads.name, q),
        like(contactLeads.email, q),
        like(contactLeads.phone, q),
      )
    )
  }
  if (params.from) {
    conditions.push(gte(contactLeads.createdAt, params.from))
  }
  if (params.to) {
    conditions.push(lte(contactLeads.createdAt, params.to))
  }

  const query = db
    .select()
    .from(contactLeads)
    .orderBy(desc(contactLeads.createdAt))

  const rows = conditions.length > 0
    ? await query.where(and(...conditions)).all()
    : await query.all()

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-100">Заявки</h1>
        <span className="text-sm text-zinc-500">
          Всього: {rows.length}
        </span>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
        <form className="flex flex-wrap items-center gap-3" method="GET">
          <select
            name="status"
            defaultValue={params.status ?? 'all'}
            className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          >
            <option value="all">Всі статуси</option>
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
          <input
            name="q"
            type="search"
            defaultValue={params.q ?? ''}
            placeholder="Имя, email або телефон..."
            className="w-64 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
          <input
            name="from"
            type="date"
            defaultValue={params.from ?? ''}
            className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
          <input
            name="to"
            type="date"
            defaultValue={params.to ?? ''}
            className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
          <button
            type="submit"
            className="rounded-lg bg-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-600"
          >
            Фільтр
          </button>
          {(params.status || params.q || params.from || params.to) && (
            <Link
              href="/admin/leads"
              className="text-sm text-zinc-500 hover:text-zinc-300"
            >
              × Скинути
            </Link>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40">
        <table className="min-w-full divide-y divide-zinc-800">
          <thead className="bg-zinc-800/30">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Статус</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Ім&apos;я</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Контакт</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Звідки</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Мова</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Дата</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-zinc-600">
                  Заявок ще немає.
                </td>
              </tr>
            ) : (
              rows.map((lead) => (
                <tr key={lead.id} className="hover:bg-zinc-800/30">
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-zinc-200">
                    {lead.name || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    <div>{lead.email && <span className="block">{lead.email}</span>}</div>
                    <div>{lead.phone && <span className="block text-xs text-zinc-600">{lead.phone}</span>}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">
                    {lead.sourcePage || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">
                    {lead.locale?.toUpperCase() || '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">
                    {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('uk-UA') : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="rounded px-2 py-1 text-amber-400 hover:bg-zinc-800"
                      >
                        Деталі
                      </Link>
                      <DeleteButton id={lead.id} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
