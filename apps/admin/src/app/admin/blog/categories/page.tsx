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
        <h1 className="text-2xl font-bold text-gray-900">Категорії блогу</h1>
        <Link href="/admin/blog/categories/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          + Нова категорія
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Статус</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Назва (RU)</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Slug</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Порядок</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {allCats.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                  Категорій ще немас.{' '}
                  <Link href="/admin/blog/categories/new" className="text-blue-600 hover:underline">Створити першу</Link>
                </td>
              </tr>
            ) : allCats.map(({ cat, tr }) => {
              const ru = tr.find((t) => t.locale === 'ru')
              return (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      cat.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                      cat.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {cat.status === 'PUBLISHED' ? 'Опубліковано' : cat.status === 'DRAFT' ? 'Чернетка' : 'Архів'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{ru?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-500">{cat.slugBase}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{cat.sortOrder}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    <Link href={`/admin/blog/categories/${cat.id}`}
                      className="rounded px-2 py-1 text-blue-600 hover:bg-blue-50">Редагувати</Link>
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
