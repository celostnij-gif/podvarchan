/**
 * Сторінка списку заявок (/admin/leads).
 * Показує таблицю з ім'ям, контактом, статусом, джерелом та датою.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { MessageSquare, Mail, Phone, ArrowRight, Clock } from 'lucide-react'
import { getLeads } from '@/lib/actions/leads'
import { StatusBadge } from '@/components/admin'

export const metadata: Metadata = {
  title: 'Заявки',
}

/* ── Helpers ── */

const LEAD_STATUS_MAP: Record<string, { label: string; variant: 'review' | 'active' | 'published' | 'scheduled' | 'archived' | 'spam' }> = {
  NEW:         { label: 'Новая',       variant: 'review' },
  IN_PROGRESS: { label: 'В работе',    variant: 'active' },
  CONTACTED:   { label: 'Связались',   variant: 'published' },
  BOOKED:      { label: 'Записан',     variant: 'scheduled' },
  CLOSED:      { label: 'Закрыта',     variant: 'archived' },
  SPAM:        { label: 'Спам',        variant: 'spam' },
}

function pluralize(n: number): string {
  if (n === 1) return 'заявка'
  if (n >= 2 && n <= 4) return 'заявки'
  return 'заявок'
}

/* ── Page ── */

export default async function LeadsPage() {
  const result = await getLeads()
  const items = result.success ? result.data : []
  const dbAvailable = result.success

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Заявки</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {items.length} {pluralize(items.length)}
          {items.filter((l) => l.status === 'NEW').length > 0 && (
            <span className="text-green-400 ml-2">
              · {items.filter((l) => l.status === 'NEW').length} новых
            </span>
          )}
        </p>
      </div>

      {/* ── Table ── */}
      {items.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-zinc-800/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800/50 bg-zinc-900/30">
                <th className="text-left px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">Имя</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider hidden sm:table-cell">Контакт</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider hidden md:table-cell">Источник</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">Статус</th>
                <th className="text-right px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider hidden lg:table-cell">Дата</th>
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {items.map((lead) => {
                const statusCfg = LEAD_STATUS_MAP[lead.status] ?? { label: lead.status, variant: 'draft' as const }
                return (
                  <tr key={lead.id} className="hover:bg-zinc-900/30 transition-colors duration-150 group">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="text-zinc-200 hover:text-gold transition-colors duration-200 font-medium"
                      >
                        {lead.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 hidden sm:table-cell">
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-zinc-600" aria-hidden="true" />
                          {lead.email}
                        </span>
                        {lead.phone && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-zinc-600" aria-hidden="true" />
                            {lead.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs hidden md:table-cell">
                      {lead.sourcePage ?? <span className="text-zinc-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={statusCfg.variant} label={statusCfg.label} />
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-zinc-600 hidden lg:table-cell">
                      <span className="flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        {lead.createdAt?.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 inline-flex items-center justify-center w-7 h-7 rounded-lg hover:bg-zinc-800/50"
                        aria-label="Просмотреть"
                      >
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── Empty State ── */
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/20 p-12 text-center">
          <MessageSquare className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-base font-medium text-zinc-300 mb-1">Нет заявок</h3>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto">
            {dbAvailable
              ? 'Заявки от клиентов будут появляться здесь после отправки формы на сайте.'
              : 'База данных недоступна. Подключите D1 для просмотра заявок.'}
          </p>
        </div>
      )}

      {!dbAvailable && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-900/10 border border-amber-800/20 text-sm text-amber-400/80">
          <span>
            База данных D1 не подключена. Запустите проект через{' '}
            <code className="text-amber-300 bg-amber-900/20 px-1.5 py-0.5 rounded text-xs">wrangler</code>{' '}
            для реальных данных.
          </span>
        </div>
      )}
    </div>
  )
}
