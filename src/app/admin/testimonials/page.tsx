/**
 * Сторінка списку відгуків (/admin/testimonials).
 * Показує таблицю з клієнтом, оцінкою, статусом та датою.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus, Star, ArrowRight } from 'lucide-react'
import { getTestimonials } from '@/lib/actions/testimonials'
import { StatusBadge } from '@/components/admin'

export const metadata: Metadata = {
  title: 'Отзывы',
}

/* ── Helpers ── */

function pluralize(n: number): string {
  if (n === 1) return 'отзыв'
  if (n >= 2 && n <= 4) return 'отзыва'
  return 'отзывов'
}

function statusToBadge(status: string): 'draft' | 'published' | 'hidden' {
  if (status === 'PUBLISHED') return 'published'
  if (status === 'HIDDEN') return 'hidden'
  return 'draft'
}

function Stars({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-zinc-600 text-xs">—</span>
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'}`}
        />
      ))}
    </span>
  )
}

/* ── Page ── */

export default async function TestimonialsPage() {
  const result = await getTestimonials()
  const items = result.success ? result.data : []
  const dbAvailable = result.success

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Отзывы</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {items.length} {pluralize(items.length)}
          </p>
        </div>
        {dbAvailable && (
          <Link
            href="/admin/testimonials/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 transition-all duration-200 text-sm font-medium"
            aria-label="Создать новый отзыв"
          >
            <Plus className="w-4 h-4" />
            Создать отзыв
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
                  Клиент
                </th>
                <th className="text-center px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider hidden sm:table-cell">
                  Рейтинг
                </th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">
                  Статус
                </th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider hidden md:table-cell">
                  Источник
                </th>
                <th className="text-right px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider hidden lg:table-cell">
                  Дата
                </th>
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {items.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-900/30 transition-colors duration-150 group">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/testimonials/${t.id}`}
                      className="text-zinc-200 hover:text-gold transition-colors duration-200 font-medium"
                    >
                      {t.clientName}
                    </Link>
                    {t.avatarInitials && (
                      <span className="text-xs text-zinc-600 ml-2">({t.avatarInitials})</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <Stars rating={t.rating} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={statusToBadge(t.status)} />
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs hidden md:table-cell">
                    {t.source ?? <span className="text-zinc-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-zinc-600 hidden lg:table-cell">
                    {t.createdAt?.toLocaleDateString('ru-RU', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    }) ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/testimonials/${t.id}`}
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
          <Star className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-base font-medium text-zinc-300 mb-1">Нет отзывов</h3>
          <p className="text-sm text-zinc-500 mb-6 max-w-sm mx-auto">
            {dbAvailable
              ? 'Добавьте первый отзыв, чтобы начать работу с модулем.'
              : 'База данных недоступна.'}
          </p>
          {dbAvailable && (
            <Link
              href="/admin/testimonials/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 transition-all duration-200 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Создать отзыв
            </Link>
          )}
        </div>
      )}

      {!dbAvailable && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-900/10 border border-amber-800/20 text-sm text-amber-400/80">
          <span>
            База данных D1 не подключена. Запустите проект через{' '}
            <code className="text-amber-300 bg-amber-900/20 px-1.5 py-0.5 rounded text-xs">wrangler</code>{' '}
            для реальных данных.
          </span>
        </div>
      )}
    </div>
  )
}
