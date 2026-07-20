import { getDB } from '@/db'
import { contactLeads, leadEvents } from '@/db/schema/leads'
import { eq, desc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { StatusChangeForm } from './status-form'
import { InternalNoteForm } from './note-form'
import { AddEventForm } from './event-form'

interface Props {
  params: Promise<{ id: string }>
}

const statusConfig: Record<string, { label: string; color: string }> = {
  NEW: { label: 'Нова', color: 'bg-blue-900/30 text-blue-400 border border-blue-700/30' },
  IN_PROGRESS: { label: 'В роботі', color: 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/30' },
  CONTACTED: { label: "Зв'язались", color: 'bg-purple-900/30 text-purple-400 border border-purple-700/30' },
  BOOKED: { label: 'Записані', color: 'bg-green-900/30 text-green-400 border border-green-700/30' },
  CLOSED: { label: 'Закрита', color: 'bg-gray-900/30 text-gray-400 border border-gray-700/30' },
  SPAM: { label: 'Спам', color: 'bg-red-900/30 text-red-400 border border-red-700/30' },
}

export default async function LeadDetailPage(props: Props) {
  const { id } = await props.params
  const db = getDB()

  const lead = await db.select().from(contactLeads).where(eq(contactLeads.id, id)).get()
  if (!lead) notFound()

  const events = await db
    .select()
    .from(leadEvents)
    .where(eq(leadEvents.leadId, id))
    .orderBy(desc(leadEvents.createdAt))
    .all()

  const statusBadge = (s: string) => {
    const cfg = statusConfig[s] ?? { label: s, color: 'bg-gray-900/30 text-gray-400 border border-gray-700/30' }
    return (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
        {cfg.label}
      </span>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/leads" className="text-sm text-amber-500 hover:text-amber-400">
          &larr; До списку заявок
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lead info card */}
          <div className="rounded-lg border bg-zinc-800/50 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-xl font-bold text-zinc-200">
                {lead.name || 'Без імені'}
              </h1>
              {statusBadge(lead.status)}
            </div>

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-zinc-500">Email</dt>
                <dd className="mt-1 text-sm text-zinc-200">
                  {lead.email ? (
                    <a href={`mailto:${lead.email}`} className="text-amber-500 hover:underline">
                      {lead.email}
                    </a>
                  ) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500">Телефон</dt>
                <dd className="mt-1 text-sm text-zinc-200">
                  {lead.phone ? (
                    <a href={`tel:${lead.phone}`} className="text-amber-500 hover:underline">
                      {lead.phone}
                    </a>
                  ) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500">Мова</dt>
                <dd className="mt-1 text-sm text-zinc-200">
                  {lead.locale === 'uk' ? 'Українська' : lead.locale === 'ru' ? 'Русский' : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500">Джерело</dt>
                <dd className="mt-1 text-sm text-zinc-200">{lead.sourcePage || '—'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-zinc-500">Дата створення</dt>
                <dd className="mt-1 text-sm text-zinc-200">
                  {lead.createdAt
                    ? new Date(lead.createdAt).toLocaleString('uk-UA')
                    : '—'}
                </dd>
              </div>
            </dl>

            {lead.message && (
              <div className="mt-4">
                <dt className="text-xs font-medium text-zinc-500">Повідомлення</dt>
                <dd className="mt-2 whitespace-pre-wrap rounded-md bg-zinc-800/50 p-3 text-sm text-zinc-200">
                  {lead.message}
                </dd>
              </div>
            )}
          </div>

          {/* Internal note */}
          <div className="rounded-lg border bg-zinc-800/50 p-6">
            <h2 className="mb-3 text-lg font-semibold text-zinc-200">Внутрішня нотатка</h2>
            <InternalNoteForm leadId={lead.id} currentNote={lead.internalNote ?? ''} />
          </div>

          {/* Event history */}
          <div className="rounded-lg border bg-zinc-800/50 p-6">
            <h2 className="mb-4 text-lg font-semibold text-zinc-200">Історія подій</h2>

            {events.length === 0 ? (
              <p className="text-sm text-zinc-500">Подій ще немає.</p>
            ) : (
              <div className="flow-root">
                <ul className="-mb-8">
                  {events.map((event, idx) => (
                    <li key={event.id}>
                      <div className="relative pb-8">
                        {idx < events.length - 1 && (
                          <span
                            className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-zinc-700"
                            aria-hidden="true"
                          />
                        )}
                        <div className="relative flex gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 ring-8 ring-zinc-800 text-xs font-bold text-zinc-400">
                            {(event.type ?? '?').charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-zinc-200">
                              {event.type || '—'}
                            </div>
                            {event.note && (
                              <p className="mt-0.5 text-sm text-zinc-400">{event.note}</p>
                            )}
                            <p className="mt-0.5 text-xs text-zinc-500">
                              {event.createdAt
                                ? new Date(event.createdAt).toLocaleString('uk-UA')
                                : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 border-t pt-4">
              <h3 className="mb-2 text-sm font-medium text-zinc-200">Додати подію</h3>
              <AddEventForm leadId={lead.id} />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status change */}
          <div className="rounded-lg border bg-zinc-800/50 p-6">
            <h2 className="mb-3 text-lg font-semibold text-zinc-200">Статус</h2>
            <StatusChangeForm leadId={lead.id} currentStatus={lead.status} />
          </div>

          {/* Meta info */}
          <div className="rounded-lg border bg-zinc-800/50 p-6">
            <h2 className="mb-3 text-lg font-semibold text-zinc-200">Технічна інформація</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-medium text-zinc-500">ID</dt>
                <dd className="mt-0.5 text-xs font-mono text-zinc-200 break-all">{lead.id}</dd>
              </div>
              {lead.ipHash && (
                <div>
                  <dt className="text-xs font-medium text-zinc-500">IP Hash</dt>
                  <dd className="mt-0.5 text-xs font-mono text-zinc-200">{lead.ipHash}</dd>
                </div>
              )}
              {lead.userAgent && (
                <div>
                  <dt className="text-xs font-medium text-zinc-500">User Agent</dt>
                  <dd className="mt-0.5 text-xs text-zinc-200 break-all">{lead.userAgent}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium text-zinc-500">Оновлено</dt>
                <dd className="mt-0.5 text-xs text-zinc-200">
                  {lead.updatedAt
                    ? new Date(lead.updatedAt).toLocaleString('uk-UA')
                    : '—'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
