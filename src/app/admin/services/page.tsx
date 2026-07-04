import { getDB } from '@/db'
import { services, serviceTranslations } from '@/db/schema/services'
import { desc, eq, and, like } from 'drizzle-orm'
import Link from 'next/link'
import { PublishButton } from './publish-button'
import { DeleteButton } from './delete-button'
import type { ServiceWithTranslations } from './types'

interface Props {
  searchParams: Promise<{ status?: string; q?: string }>
}

export default async function ServicesListPage(props: Props) {
  const params = await props.searchParams
  const db = getDB()

  const conditions = []
  if (params.status && params.status !== 'all') {
    conditions.push(eq(services.status, params.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'))
  }
  if (params.q) {
    conditions.push(like(serviceTranslations.title, `%${params.q}%`))
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const rows = await db
    .select()
    .from(services)
    .leftJoin(serviceTranslations, eq(services.id, serviceTranslations.serviceId))
    .where(where)
    .orderBy(desc(services.updatedAt))
    .all()

  // Group translations by service
  const grouped = new Map<string, ServiceWithTranslations>()
  for (const row of rows) {
    if (!grouped.has(row.services.id)) {
      grouped.set(row.services.id, {
        ...row.services,
        translations: [],
      })
    }
    if (row.service_translations) {
      grouped.get(row.services.id)!.translations.push(row.service_translations as any)
    }
  }
  const allServices = Array.from(grouped.values())


  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Послуги</h1>
        <Link
          href="/admin/services/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          + Нова послуга
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
        <form className="flex items-center gap-3" method="GET" id="services-filter">
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
            <option value="PUBLISHED">Опубліковані</option>
            <option value="DRAFT">Чернетки</option>
            <option value="ARCHIVED">Архів</option>
          </select>
          <input
            name="q"
            type="search"
            defaultValue={params.q ?? ''}
            placeholder="Пошук по назві..."
            className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
          >
            Знайти
          </button>
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
                Назва (RU)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Назва (UK)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Категорія
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Пріоритет
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Slug
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Дії
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {allServices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                  Послуг ще немає.{' '}
                  <Link href="/admin/services/new" className="text-blue-600 hover:underline">
                    Створити першу
                  </Link>
                </td>
              </tr>
            ) : (
              allServices.map((svc) => {
                const ru = svc.translations.find((t) => t.locale === 'ru')
                const uk = svc.translations.find((t) => t.locale === 'uk')

                return (
                  <tr key={svc.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge status={svc.status} />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {ru?.title ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {uk?.title ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {svc.category || '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {svc.priority}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 font-mono">
                      {svc.slugBase}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <PublishButton id={svc.id} status={svc.status} />
                        <Link
                          href={`/admin/services/${svc.id}`}
                          className="rounded px-2 py-1 text-blue-600 hover:bg-blue-50"
                        >
                          Редагувати
                        </Link>
                        <DeleteButton id={svc.id} />
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PUBLISHED: 'bg-green-100 text-green-800',
    DRAFT: 'bg-yellow-100 text-yellow-800',
    ARCHIVED: 'bg-gray-100 text-gray-600',
  }
  const labels: Record<string, string> = {
    PUBLISHED: 'Опубліковано',
    DRAFT: 'Чернетка',
    ARCHIVED: 'Архів',
  }

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? styles.DRAFT}`}
    >
      {labels[status] ?? status}
    </span>
  )
}
