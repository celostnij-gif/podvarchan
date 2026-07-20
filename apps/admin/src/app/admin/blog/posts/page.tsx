import ViewOnSiteLink from '@/components/admin/ViewOnSiteLink'
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
        <h1 className="text-2xl font-bold text-zinc-100">Пости блогу</h1>
        <Link href="/admin/blog/posts/new"
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2">
          + Новий пост
        </Link>
      </div>
      <div className="mb-4 flex items-center gap-4 border-b border-zinc-800 pb-2">
        <span className="text-sm font-medium text-amber-400">Пости</span>
        <Link href="/admin/blog/categories" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
          Категорії
        </Link>
      </div>

      <div className="mb-4">
        <form className="flex items-center gap-3" method="GET">
          <select name="status" defaultValue={params.status ?? 'all'}
            className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30">
            <option value="all">Всі статуси</option>
            <option value="PUBLISHED">Опубліковані</option>
            <option value="DRAFT">Чернетки</option>
            <option value="ARCHIVED">Архів</option>
          </select>
          <input name="q" type="search" defaultValue={params.q ?? ''} placeholder="Пошук..."
            className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
          <button type="submit" className="rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700">Знайти</button>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <table className="min-w-full divide-y divide-zinc-800">
          <thead className="bg-zinc-800/30">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Статус</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Заголовок (RU)</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Категорія</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Дата</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {allPosts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-500">
                  Постів ще немає.{' '}
                  <Link href="/admin/blog/posts/new" className="text-amber-400 hover:text-amber-300">Написати перший</Link>
                </td>
              </tr>
            ) : allPosts.map((post) => {
              const ru = post.translations.find((t) => t.locale === 'ru')
              return (
                <tr key={post.id} className="hover:bg-zinc-800/30">
                  <td className="whitespace-nowrap px-4 py-3">
                    <PublishBadge status={post.status} />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-zinc-200 max-w-xs truncate">
                    {ru?.title ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">{post.categorySlug ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">
                    {post.publishedAt ? post.publishedAt.slice(0, 10) : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    <Link href={`/admin/blog/posts/${post.id}`}
                      className="rounded px-2 py-1 text-amber-400 hover:bg-zinc-800">Редагувати</Link>
                    {post.status === 'PUBLISHED' && ru?.slug && (
                      <ViewOnSiteLink href={`/ru/blog/${ru.slug}`} />
                    )}
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
    PUBLISHED: 'bg-green-900/30 text-green-400 border border-green-700/30',
    DRAFT: 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/30',
    REVIEW: 'bg-blue-900/30 text-blue-400 border border-blue-700/30',
    ARCHIVED: 'bg-zinc-800 text-zinc-500 border border-zinc-700/50',
  } as const
  const labels: Record<string, string> = {
    PUBLISHED: 'Опубліковано',
    DRAFT: 'Чернетка',
    REVIEW: 'На ревю',
    ARCHIVED: 'Архів',
  } as const
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? styles.DRAFT}`}>
      {labels[status] ?? status}
    </span>
  )
}
