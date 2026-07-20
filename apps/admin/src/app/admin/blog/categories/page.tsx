import { getDB } from '@/db'
import { blogCategories, blogCategoryTranslations } from '@/db/schema/blog'
import { eq } from 'drizzle-orm'
import Link from 'next/link'

export default async function BlogCategoriesPage() {
  const db = getDB()

  const rows = await db
    .select()
    .from(blogCategories)
    .leftJoin(blogCategoryTranslations, eq(blogCategories.id, blogCategoryTranslations.categoryId))
    .orderBy(blogCategories.sortOrder)
    .all()

  const grouped = new Map<string, { cat: typeof rows[number]['blog_categories']; tr: NonNullable<typeof rows[number]['blog_category_translations']>[] }>()
  for (const row of rows) {
    if (!grouped.has(row.blog_categories.id)) {
      grouped.set(row.blog_categories.id, { cat: row.blog_categories, tr: [] })
    }
    if (row.blog_category_translations) {
      grouped.get(row.blog_categories.id)!.tr.push(row.blog_category_translations)
    }
  }

  const allCats = Array.from(grouped.values())

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-100">Категорії блогу</h1>
        <Link href="/admin/blog/categories/new"
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2">
          + Нова категорія
        </Link>
      </div>
      <div className="mb-4 flex items-center gap-4 border-b border-zinc-800 pb-2">
        <Link href="/admin/blog/posts" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
          Пости
        </Link>
        <span className="text-sm font-medium text-amber-400">Категорії</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <table className="min-w-full divide-y divide-zinc-800">
          <thead className="bg-zinc-800/30">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Статус</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Назва (RU)</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Slug</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Порядок</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {allCats.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-500">
                  Категорій ще немас.{' '}
                  <Link href="/admin/blog/categories/new" className="text-amber-400 hover:text-amber-300">Створити першу</Link>
                </td>
              </tr>
            ) : allCats.map(({ cat, tr }) => {
              const ru = tr.find((t) => t.locale === 'ru')
              return (
                <tr key={cat.id} className="hover:bg-zinc-800/30">
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      cat.status === 'PUBLISHED' ? 'bg-green-900/30 text-green-400 border border-green-700/30' :
                      cat.status === 'DRAFT' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/30' :
                      'bg-zinc-800 text-zinc-500 border border-zinc-700/50'
                    }`}>
                      {cat.status === 'PUBLISHED' ? 'Опубліковано' : cat.status === 'DRAFT' ? 'Чернетка' : 'Архів'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-zinc-200">{ru?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-sm font-mono text-zinc-500">{cat.slugBase}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">{cat.sortOrder}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    <Link href={`/admin/blog/categories/${cat.id}`}
                      className="rounded px-2 py-1 text-amber-400 hover:bg-zinc-800">Редагувати</Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
