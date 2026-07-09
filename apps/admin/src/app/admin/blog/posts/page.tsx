import { getDB } from '@/db'
import { blogPosts, blogPostTranslations, blogCategories, blogCategoryTranslations } from '@/db/schema/blog'
import { eq, desc, and, like } from 'drizzle-orm'
import Link from 'next/link'
import type { PostWithTranslations } from '../types'

interface Props {
  searchParams: Promise<{ status?: string; q?: string; cat?: string }>
}

export default async function BlogPostsPage(props: Props) {
  const params = await props.searchParams
  const db = getDB()

  const conditions = []
  if (params.status && params.status !== 'all') {
    conditions.push(eq(blogPosts.status, params.status as 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED'))
  }
  if (params.q) {
    conditions.push(like(blogPostTranslations.title, `%${params.q}%`))
  }

  const query = db
    .select()
    .from(blogPosts)
    .leftJoin(blogPostTranslations, eq(blogPosts.id, blogPostTranslations.postId))
    .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
    .leftJoin(blogCategoryTranslations, eq(blogCategories.id, blogCategoryTranslations.categoryId))
    .orderBy(desc(blogPosts.updatedAt))

  const rows = conditions.length > 0
    ? await query.where(and(...conditions)).all()
    : await query.all()

  // Group translations
  const grouped = new Map<string, PostWithTranslations>()
  for (const row of rows) {
    if (!grouped.has(row.blog_posts.id)) {
      grouped.set(row.blog_posts.id, {
        ...row.blog_posts,
        translations: [],
        categorySlug: row.blog_categories?.slugBase ?? null,
      })
    }
    if (row.blog_post_translations) {
      grouped.get(row.blog_posts.id)!.translations.push(row.blog_post_translations)
    }
  }

  const allPosts = Array.from(grouped.values())

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Пости блогу</h1>
        <Link href="/admin/blog/posts/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          + Новий пост
        </Link>
      </div>

      <div className="mb-4">
        <form className="flex items-center gap-3" method="GET">
          <select name="status" defaultValue={params.status ?? 'all'}
            onChange={(e) => { const form = e.target.closest('form'); if (form) form.requestSubmit() }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option value="all">Всі статуси</option>
            <option value="PUBLISHED">Опубліковані</option>
            <option value="DRAFT">Чернетки</option>
            <option value="ARCHIVED">Архів</option>
          </select>
          <input name="q" type="search" defaultValue={params.q ?? ''} placeholder="Пошук..."
            className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          <button type="submit" className="rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200">Знайти</button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Статус</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Заголовок (RU)</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Категорія</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Дата</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {allPosts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                  Постів ще немає.{' '}
                  <Link href="/admin/blog/posts/new" className="text-blue-600 hover:underline">Написати перший</Link>
                </td>
              </tr>
            ) : allPosts.map((post) => {
              const ru = post.translations.find((t) => t.locale === 'ru')
              return (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3">
                    <PublishBadge status={post.status} />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-xs truncate">
                    {ru?.title ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{post.categorySlug ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {post.publishedAt ? post.publishedAt.slice(0, 10) : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    <Link href={`/admin/blog/posts/${post.id}`}
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

function PublishBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PUBLISHED: 'bg-green-100 text-green-800',
    DRAFT: 'bg-yellow-100 text-yellow-800',
    REVIEW: 'bg-blue-100 text-blue-800',
    ARCHIVED: 'bg-gray-100 text-gray-600',
  } as const
  const labels: Record<string, string> = {
    PUBLISHED: 'Опубліковано',
    DRAFT: 'Чернетка',
    REVIEW: 'На ревю',
    ARCHIVED: 'Архів',
  } as const
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? styles.DRAFT}`}>
      {labels[status] ?? status}
    </span>
  )
}
