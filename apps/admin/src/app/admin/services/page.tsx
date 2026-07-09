import { getDB } from '@/db'
import { services, serviceTranslations } from '@/db/schema/services'
import { eq, and, like } from 'drizzle-orm'
import Link from 'next/link'
import type { ServiceTranslation, ServiceWithTranslations } from './types'
import { ServicesSortableList } from './services-sortable-list'

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

  const query = db
    .select()
    .from(services)
    .leftJoin(serviceTranslations, eq(services.id, serviceTranslations.serviceId))
    .orderBy(services.sortOrder)

  const rows = conditions.length > 0
    ? await query.where(and(...conditions)).all()
    : await query.all()

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
      grouped.get(row.services.id)!.translations.push(row.service_translations as unknown as ServiceTranslation)
    }
  }
  const allServices = Array.from(grouped.values())

  const items = allServices.map((svc) => {
    const ru = svc.translations.find((t) => t.locale === 'ru')
    const uk = svc.translations.find((t) => t.locale === 'uk')
    return {
      id: svc.id,
      slugBase: svc.slugBase,
      status: svc.status,
      category: svc.category,
      priority: svc.priority,
      titleRu: ru?.title ?? null,
      titleUk: uk?.title ?? null,
    }
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-100">Послуги</h1>
        <Link
          href="/admin/services/new"
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
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
            className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
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
            className="w-64 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
          <button
            type="submit"
            className="rounded-lg bg-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-600"
          >
            Знайти
          </button>
        </form>
      </div>

      {/* Sortable list */}
      <ServicesSortableList items={items} />
    </div>
  )
}
