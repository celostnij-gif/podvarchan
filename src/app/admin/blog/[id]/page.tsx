/**
 * Сторінка редактора статті (/admin/blog/[id]).
 * Підтримує два режими:
 *   — /admin/blog/new   → створення нової статті
 *   — /admin/blog/[id]  → редагування існуючої
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getBlogPost } from '@/lib/actions/blog'
import { BlogEditor } from '@/components/admin'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params

  if (id === 'new') {
    return { title: 'Новая статья' }
  }

  const result = await getBlogPost(id)
  if (!result.success) {
    return { title: 'Статья' }
  }

  const ru = result.data.translations.find((t) => t.locale === 'ru')
  return { title: ru?.title ?? result.data.id.slice(0, 8) }
}

export default async function BlogEditPage({ params }: Props) {
  const { id } = await params

  // ── Режим створення ──
  if (id === 'new') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Новая статья</h1>
          <p className="text-sm text-zinc-500 mt-1">Заполните заголовок, slug и содержание</p>
        </div>
        <BlogEditor mode="create" />
      </div>
    )
  }

  // ── Режим редагування ──
  const result = await getBlogPost(id)

  if (!result.success) {
    if (result.error.includes('не знайдено') || result.error.includes('not found')) {
      notFound()
    }
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Ошибка загрузки</h1>
          <p className="text-sm text-zinc-500 mt-1">{result.error}</p>
        </div>
      </div>
    )
  }

  const { data: post } = result

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">
          {post.translations.find((t) => t.locale === 'ru')?.title ?? post.id.slice(0, 8) + '…'}
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          <StatusBadgeInline status={post.status} />
        </p>
      </div>
      <BlogEditor mode="edit" post={post} />
    </div>
  )
}

/* ── Inline status badge for server component ── */

function StatusBadgeInline({ status }: { status: string }) {
  const STYLES: Record<string, string> = {
    DRAFT: 'bg-zinc-800/60 text-zinc-400 border-zinc-700/50',
    REVIEW: 'bg-blue-900/30 text-blue-400 border-blue-700/30',
    PUBLISHED: 'bg-green-900/30 text-green-400 border-green-700/30',
    SCHEDULED: 'bg-amber-900/30 text-amber-400 border-amber-700/30',
    ARCHIVED: 'bg-zinc-900/50 text-zinc-600 border-zinc-800/50',
  }

  const LABELS: Record<string, string> = {
    DRAFT: 'Черновик',
    REVIEW: 'На проверке',
    PUBLISHED: 'Опубликовано',
    SCHEDULED: 'Запланировано',
    ARCHIVED: 'Архив',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border ${STYLES[status] ?? STYLES.DRAFT}`}>
      {LABELS[status] ?? status}
    </span>
  )
}
