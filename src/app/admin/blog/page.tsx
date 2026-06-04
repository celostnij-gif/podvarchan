/**
 * Сторінка списку статей (/admin/blog).
 * Показує таблицю з назвою, категорією, статусом, часом читання та датою публікації.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus, FileText, ArrowRight, Clock } from 'lucide-react'
import { getActionDb } from '@/lib/actions/db'
import { eq, desc, and } from 'drizzle-orm'
import * as s from '@/db/schema'
import { StatusBadge } from '@/components/admin'

export const metadata: Metadata = {
  title: 'Блог',
}

/* ── Types ── */

interface BlogRow {
  id: string
  categoryId: string | null
  authorId: string | null
  status: 'DRAFT' | 'REVIEW' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED'
  readingMinutes: number
  publishedAt: Date | null
  createdAt: Date | null
  updatedAt: Date | null
  titleRu: string | null
  slugRu: string | null
  categoryName: string | null
}

/* ── Data fetching ── */

async function getBlogList(): Promise<{ items: BlogRow[]; dbAvailable: boolean }> {
  try {
    const db = getActionDb()

    const rows = await db
      .select({
        id: s.blogPosts.id,
        categoryId: s.blogPosts.categoryId,
        authorId: s.blogPosts.authorId,
        status: s.blogPosts.status,
        readingMinutes: s.blogPosts.readingMinutes,
        publishedAt: s.blogPosts.publishedAt,
        createdAt: s.blogPosts.createdAt,
        updatedAt: s.blogPosts.updatedAt,
        titleRu: s.blogPostTranslations.title,
        slugRu: s.blogPostTranslations.slug,
        categoryName: s.blogCategoryTranslations.name,
      })
      .from(s.blogPosts)
      .leftJoin(
        s.blogPostTranslations,
        and(
          eq(s.blogPostTranslations.postId, s.blogPosts.id),
          eq(s.blogPostTranslations.locale, 'ru'),
        ),
      )
      .leftJoin(
        s.blogCategoryTranslations,
        and(
          eq(s.blogCategoryTranslations.categoryId, s.blogPosts.categoryId),
          eq(s.blogCategoryTranslations.locale, 'ru'),
        ),
      )
      .orderBy(desc(s.blogPosts.updatedAt))

    return { items: rows as BlogRow[], dbAvailable: true }
  } catch {
    return { items: [], dbAvailable: false }
  }
}

/* ── Helpers ── */

const STATUS_MAP: Record<string, 'draft' | 'review' | 'published' | 'scheduled' | 'archived'> = {
  DRAFT: 'draft',
  REVIEW: 'review',
  PUBLISHED: 'published',
  SCHEDULED: 'scheduled',
  ARCHIVED: 'archived',
}

function pluralize(n: number): string {
  if (n === 1) return 'статья'
  if (n >= 2 && n <= 4) return 'статьи'
  return 'статей'
}

/* ── Page ── */

export default async function BlogPage() {
  const { items, dbAvailable } = await getBlogList()

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Блог</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {items.length} {pluralize(items.length)}
          </p>
        </div>
        {dbAvailable && (
          <Link
            href="/admin/blog/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 transition-all duration-200 text-sm font-medium"
            aria-label="Создать новую статью"
          >
            <Plus className="w-4 h-4" />
            Создать статью
          </Link>
        )}
      </div>

      {/* ── Table ── */}
      {items.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-zinc-800/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800/50 bg-zinc-900/30">
                <th className="text-left px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">
                  Название
                </th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider hidden md:table-cell">
                  Категория
                </th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">
                  Статус
                </th>
                <th className="text-center px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider hidden sm:table-cell">
                  Чтение
                </th>
                <th className="text-right px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider hidden lg:table-cell">
                  Дата
                </th>
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {items.map((post) => (
                <tr
                  key={post.id}
                  className="hover:bg-zinc-900/30 transition-colors duration-150 group"
                >
                  {/* Title + slug */}
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/blog/${post.id}`}
                      className="text-zinc-200 hover:text-gold transition-colors duration-200 font-medium"
                    >
                      {post.titleRu ?? post.slugRu ?? post.id.slice(0, 8) + '…'}
                    </Link>
                    {post.slugRu && (
                      <p className="text-xs text-zinc-600 mt-0.5">
                        /{post.slugRu}
                      </p>
                    )}
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3 text-zinc-500 text-xs hidden md:table-cell">
                    {post.categoryName ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-zinc-800/50 text-zinc-400 text-[11px]">
                        {post.categoryName}
                      </span>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge status={STATUS_MAP[post.status] ?? 'draft'} />
                  </td>

                  {/* Reading time */}
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      {post.readingMinutes} мин
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-right text-xs text-zinc-600 hidden lg:table-cell">
                    {(post.publishedAt ?? post.createdAt)?.toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    }) ?? '—'}
                  </td>

                  {/* Edit link */}
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/blog/${post.id}`}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 inline-flex items-center justify-center w-7 h-7 rounded-lg hover:bg-zinc-800/50"
                      aria-label="Редактировать"
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── Empty State ── */
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/20 p-12 text-center">
          <FileText className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-base font-medium text-zinc-300 mb-1">Нет статей</h3>
          <p className="text-sm text-zinc-500 mb-6 max-w-sm mx-auto">
            {dbAvailable
              ? 'Создайте первую статью, чтобы начать работу с модулем.'
              : 'База данных недоступна. Подключите D1 для просмотра статей.'}
          </p>
          {dbAvailable && (
            <Link
              href="/admin/blog/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 transition-all duration-200 text-sm font-medium"
              aria-label="Создать новую статью"
            >
              <Plus className="w-4 h-4" />
              Создать статью
            </Link>
          )}
        </div>
      )}

      {/* ── D1 unavailable banner ── */}
      {!dbAvailable && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-900/10 border border-amber-800/20 text-sm text-amber-400/80">
          <span>
            База данных D1 не подключена. Запустите проект через{' '}
            <code className="text-amber-300 bg-amber-900/20 px-1.5 py-0.5 rounded text-xs">
              wrangler
            </code>{' '}
            для реальных данных.
          </span>
        </div>
      )}
    </div>
  )
}
