import { getDB } from '@/db'
import { pages, pageTranslations } from '@/db/schema/pages'
import { desc, eq, and, like } from 'drizzle-orm'
import Link from 'next/link'
import { DeleteButton } from './delete-button'
import { PublishToggle } from './publish-toggle'
import type { PageRecord, PageTranslationRecord } from './types'

export const dynamic = 'force-dynamic'

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
        <h1 className="text-2xl font-bold text-zinc-100">Сторінки</h1>
        <Link
          href="/admin/pages/new"
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
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
            placeholder="Пошук за назвою..."
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

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
        <table className="min-w-full divide-y divide-zinc-800">
          <thead className="bg-zinc-800/30">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Назва</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">URL</th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500">Статус</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {allPages.map((page) => {
              const slugs = getLocalizedSlug(page.translations)
              return (
                <tr key={page.id} className="hover:bg-zinc-800/30">
                  <td className="px-4 py-3">
                    <Link href={`/admin/pages/${page.id}`} className="text-sm font-medium text-amber-400 hover:text-amber-300">
                      {getLocalizedTitle(page.translations)}
                    </Link>
                    <div className="text-xs text-zinc-600">{page.type}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-zinc-500">
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
                        className="rounded px-2 py-1 text-xs font-medium text-amber-400 hover:bg-zinc-800"
                      >
                        Редагувати
                      </Link>
                      <DeleteButton pageId={page.id} pageTitle={getLocalizedTitle(page.translations)} />
                    </div>
                  </td>
                </tr>
              )
            })}
            {allPages.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-zinc-600">
                  Сторінки не знайдені
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
