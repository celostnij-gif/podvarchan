/**
 * Сторінка списку послуг (/admin/services).
 * Показує таблицю з іконкою, назвою, slug, статусом, пріоритетом та датою зміни.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus, Puzzle, ArrowRight } from 'lucide-react'
import { getActionDb } from '@/lib/actions/db'
import { eq, desc, and } from 'drizzle-orm'
import * as s from '@/db/schema'
import { StatusBadge } from '@/components/admin'

export const metadata: Metadata = {
  title: 'Услуги',
}

/* ── Types ── */

interface ServiceRow {
  id: string
  slugBase: string
  icon: string | null
  category: string | null
  priority: number
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  sortOrder: number
  publishedAt: Date | null
  createdAt: Date | null
  updatedAt: Date | null
  titleRu: string | null
  slugRu: string | null
}

/* ── Data fetching ── */

async function getServicesList(): Promise<{ items: ServiceRow[]; dbAvailable: boolean }> {
  try {
    const db = getActionDb()

    const rows = await db
      .select({
        id: s.services.id,
        slugBase: s.services.slugBase,
        icon: s.services.icon,
        category: s.services.category,
        priority: s.services.priority,
        status: s.services.status,
        sortOrder: s.services.sortOrder,
        publishedAt: s.services.publishedAt,
        createdAt: s.services.createdAt,
        updatedAt: s.services.updatedAt,
        titleRu: s.serviceTranslations.title,
        slugRu: s.serviceTranslations.slug,
      })
      .from(s.services)
      .leftJoin(
        s.serviceTranslations,
        and(
          eq(s.serviceTranslations.serviceId, s.services.id),
          eq(s.serviceTranslations.locale, 'ru'),
        ),
      )
      .orderBy(desc(s.services.updatedAt))

    return { items: rows as ServiceRow[], dbAvailable: true }
  } catch {
    return { items: [], dbAvailable: false }
  }
}

/* ── Helpers ── */

function statusToBadge(status: string): 'draft' | 'published' | 'archived' {
  if (status === 'PUBLISHED') return 'published'
  if (status === 'ARCHIVED') return 'archived'
  return 'draft'
}

function pluralize(n: number): string {
  if (n === 1) return 'услуга'
  if (n >= 2 && n <= 4) return 'услуги'
  return 'услуг'
}

/* ── Page ── */

export default async function ServicesPage() {
  const { items, dbAvailable } = await getServicesList()

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Услуги</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {items.length} {pluralize(items.length)}
          </p>
        </div>
        {dbAvailable && (
          <Link
            href="/admin/services/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 transition-all duration-200 text-sm font-medium"
            aria-label="Создать новую услугу"
          >
            <Plus className="w-4 h-4" />
            Создать услугу
          </Link>
        )}
      </div>

      {/* ── Table ── */}
      {items.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-zinc-800/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800/50 bg-zinc-900/30">
                <th className="w-10 px-4 py-3" />
                <th className="text-left px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">
                  Название
                </th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider hidden md:table-cell">
                  Slug
                </th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">
                  Статус
                </th>
                <th className="text-center px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider hidden sm:table-cell">
                  Приоритет
                </th>
                <th className="text-right px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider hidden lg:table-cell">
                  Изменено
                </th>
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {items.map((service) => (
                <tr
                  key={service.id}
                  className="hover:bg-zinc-900/30 transition-colors duration-150 group"
                >
                  {/* Icon */}
                  <td className="px-4 py-3">
                    {service.icon ? (
                      <span className="text-lg leading-none">{service.icon}</span>
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-zinc-900/70 border border-zinc-800/50 flex items-center justify-center">
                        <Puzzle className="w-3.5 h-3.5 text-zinc-500" />
                      </div>
                    )}
                  </td>

                  {/* Name + slug */}
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/services/${service.id}`}
                      className="text-zinc-200 hover:text-gold transition-colors duration-200 font-medium"
                    >
                      {service.titleRu ?? service.slugBase}
                    </Link>
                    {service.category && (
                      <p className="text-xs text-zinc-600 mt-0.5">{service.category}</p>
                    )}
                  </td>

                  {/* Slug */}
                  <td className="px-4 py-3 text-zinc-500 text-xs hidden md:table-cell">
                    <code className="bg-zinc-900/70 px-1.5 py-0.5 rounded text-[11px]">
                      {service.slugRu ?? service.slugBase}
                    </code>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge status={statusToBadge(service.status)} />
                  </td>

                  {/* Priority */}
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-medium ${
                        service.priority <= 2
                          ? 'bg-red-900/20 text-red-400'
                          : service.priority <= 5
                            ? 'bg-amber-900/20 text-amber-400'
                            : 'bg-zinc-800/50 text-zinc-500'
                      }`}
                    >
                      {service.priority}
                    </span>
                  </td>

                  {/* Updated */}
                  <td className="px-4 py-3 text-right text-xs text-zinc-600 hidden lg:table-cell">
                    {service.updatedAt?.toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    }) ?? '—'}
                  </td>

                  {/* Edit link */}
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/services/${service.id}`}
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
          <Puzzle className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-base font-medium text-zinc-300 mb-1">Нет услуг</h3>
          <p className="text-sm text-zinc-500 mb-6 max-w-sm mx-auto">
            {dbAvailable
              ? 'Создайте первую услугу, чтобы начать работу с модулем.'
              : 'База данных недоступна. Подключите D1 для просмотра услуг.'}
          </p>
          {dbAvailable && (
            <Link
              href="/admin/services/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 transition-all duration-200 text-sm font-medium"
              aria-label="Создать новую услугу"
            >
              <Plus className="w-4 h-4" />
              Создать услугу
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
