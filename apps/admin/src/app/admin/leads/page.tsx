import { getDB } from '@/db'
import { contactLeads } from '@/db/schema/leads'
import { desc, eq, and, or, like, gte, lte } from 'drizzle-orm'
import Link from 'next/link'
import { DeleteButton } from './delete-button'

interface Props {
  searchParams: Promise<{ status?: string; q?: string; from?: string; to?: string }>
}

const statusConfig: Record<string, { label: string; color: string }> = {
  NEW: { label: 'Нова', color: 'bg-blue-100 text-blue-800' },
  IN_PROGRESS: { label: 'В роботі', color: 'bg-yellow-100 text-yellow-800' },
  CONTACTED: { label: 'Зв\'язались', color: 'bg-purple-100 text-purple-800' },
  BOOKED: { label: 'Записані', color: 'bg-green-100 text-green-800' },
  CLOSED: { label: 'Закрита', color: 'bg-gray-100 text-gray-800' },
  SPAM: { label: 'Спам', color: 'bg-red-100 text-red-800' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? { label: status, color: 'bg-gray-100 text-gray-800' }
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
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

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const rows = await db
    .select()
    .from(contactLeads)
    .where(where)
    .orderBy(desc(contactLeads.createdAt))
    .all()

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Заявки</h1>
        <span className="text-sm text-gray-500">
          Всього: {rows.length}
        </span>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
        <form className="flex flex-wrap items-center gap-3" method="GET">
          <select
            name="status"
            defaultValue={params.status ?? 'all'}
            onChange={(e) => {
              const form = e.target.closest('form')
              if (form) form.requestSubmit()
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            placeholder="Ім'я, email або телефон..."
            className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <input
            name="from"
            type="date"
            defaultValue={params.from ?? ''}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <input
            name="to"
            type="date"
            defaultValue={params.to ?? ''}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
          >
            Фільтр
          </button>
          {(params.status || params.q || params.from || params.to) && (
            <Link
              href="/admin/leads"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              × Скинути
            </Link>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Статус
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Ім&apos;я
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Контакт
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Звідки
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Мова
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Дата
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Дії
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                  Заявок ще немає.
                </td>
              </tr>
            ) : (
              rows.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {lead.name || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div>{lead.email && <span className="block">{lead.email}</span>}</div>
                    <div>{lead.phone && <span className="block text-xs text-gray-500">{lead.phone}</span>}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {lead.sourcePage || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {lead.locale?.toUpperCase() || '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('uk-UA') : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="rounded px-2 py-1 text-blue-600 hover:bg-blue-50"
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
