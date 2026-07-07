import { getDB } from '@/db'
import { pages, pageTranslations } from '@/db/schema/pages'
import { desc, eq, and, like } from 'drizzle-orm'
import Link from 'next/link'
import { DeleteButton } from './delete-button'
import { PublishToggle } from './publish-toggle'
import type { PageRecord, PageTranslationRecord } from './types'

interface Props {
  searchParams: Promise<{ status?: string; q?: string }>
}

export default async function PagesListPage(props: Props) {
  const params = await props.searchParams
  const db = getDB()

  const conditions = []
  if (params.status && params.status !== 'all') {
    conditions.push(eq(pages.status, params.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'))
  }
  if (params.q) {
    conditions.push(like(pageTranslations.title, `%${params.q}%`))
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const rows = await db
    .select()
    .from(pages)
    .leftJoin(pageTranslations, eq(pages.id, pageTranslations.pageId))
    .where(where)
    .orderBy(desc(pages.updatedAt))
    .all()

  // Group translations by page
  const grouped = new Map<string, PageRecord & { translations: PageTranslationRecord[] }>()
  for (const row of rows) {
    if (!grouped.has(row.pages.id)) {
      grouped.set(row.pages.id, {
        ...row.pages,
        translations: [],
      })
    }
    const translation = row.page_translations
    if (translation) {
      const t = translation as PageTranslationRecord
      grouped.get(row.pages.id)!.translations.push(t)
    }
  }
  const allPages = Array.from(grouped.values())

  const getLocalizedTitle = (translations: PageTranslationRecord[]) => {
    const ru = translations.find((t) => t.locale === 'ru')
    const uk = translations.find((t) => t.locale === 'uk')
    return ru?.title || uk?.title || 'Без названия'
  }

  const getLocalizedSlug = (translations: PageTranslationRecord[]) => {
    const ru = translations.find((t) => t.locale === 'ru')
    const uk = translations.find((t) => t.locale === 'uk')
    return { ru: ru?.slug || '', uk: uk?.slug || '' }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Сторінки</h1>
        <Link
          href="/admin/pages/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          + Нова сторінка
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
        <form className="flex items-center gap-3" method="GET" id="pages-filter">
          <select
            name="status"
            defaultValue={params.status ?? 'all'}
            onChange={(e) => {
              const form = e.target.closest('form') as HTMLFormElement | null
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
            placeholder="Пошук за назвою..."
            className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
          >
            Пошук
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Назва</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">URL</th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Статус</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {allPages.map((page) => {
              const slugs = getLocalizedSlug(page.translations)
              return (
                <tr key={page.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/pages/${page.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                      {getLocalizedTitle(page.translations)}
                    </Link>
                    <div className="text-xs text-gray-400">{page.type}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-gray-500">
                      {slugs.ru && <div>/ru/{slugs.ru}</div>}
                      {slugs.uk && <div>/uk/{slugs.uk}</div>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <PublishToggle pageId={page.id} currentStatus={page.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/pages/${page.id}`}
                        className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                      >
                        Редактировать
                      </Link>
                      <DeleteButton pageId={page.id} pageTitle={getLocalizedTitle(page.translations)} />
                    </div>
                  </td>
                </tr>
              )
            })}
            {allPages.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                  Страницы не найдены
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
