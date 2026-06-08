/**
 * Сторінка списку SEO-метаданих (/admin/seo).
 * Показує таблицю з сутністю, локаллю, title, описом та статусом robots.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { Search, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { getSeoMetaList } from '@/lib/actions/seo'
import { calculateSeoScore } from '@/lib/seo/score'

export const metadata: Metadata = {
  title: 'SEO',
}

/* ── Helpers ── */

const ENTITY_LABELS: Record<string, string> = {
  SERVICE: 'Услуга',
  BLOG_POST: 'Статья',
  PAGE: 'Страница',
  FAQ: 'FAQ',
  TESTIMONIAL: 'Отзыв',
  BLOG_CATEGORY: 'Категория блога',
}

function pluralize(n: number): string {
  if (n === 1) return 'запись'
  if (n >= 2 && n <= 4) return 'записи'
  return 'записей'
}

function getEntityEditUrl(entityType: string, entityId: string, fallbackId: string): string {
  const prefixes: Record<string, string> = {
    SERVICE: '/admin/services/',
    BLOG_POST: '/admin/blog/',
    PAGE: '/admin/pages/',
    FAQ: '/admin/faq/',
    TESTIMONIAL: '/admin/testimonials/',
  }
  return (prefixes[entityType] ?? '/admin/seo/') + (prefixes[entityType] ? entityId : fallbackId)
}

/* ── Page ── */

export default async function SeoPage() {
  const result = await getSeoMetaList()
  const items = result.success ? result.data : []
  const dbAvailable = result.success

  const totalIndexed = items.filter((m) => m.robotsIndex).length
  const totalNoIndex = items.filter((m) => !m.robotsIndex).length
  const totalMissingDescription = items.filter((m) => !m.description).length
  const totalMissingOgTitle = items.filter((m) => !m.ogTitle).length

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">SEO</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {items.length} {pluralize(items.length)}
        </p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4">
          <p className="text-2xl font-bold text-zinc-100">{totalIndexed}</p>
          <p className="text-xs text-zinc-500 mt-0.5">Индексируется</p>
        </div>
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4">
          <p className="text-2xl font-bold text-zinc-100">{totalNoIndex}</p>
          <p className="text-xs text-zinc-500 mt-0.5">Скрыто от индексации</p>
        </div>
        <div className="rounded-xl border border-amber-800/20 bg-amber-900/10 p-4">
          <p className="text-2xl font-bold text-amber-400">{totalMissingDescription}</p>
          <p className="text-xs text-amber-400/70 mt-0.5">Без meta-description</p>
        </div>
        <div className="rounded-xl border border-amber-800/20 bg-amber-900/10 p-4">
          <p className="text-2xl font-bold text-amber-400">{totalMissingOgTitle}</p>
          <p className="text-xs text-amber-400/70 mt-0.5">Без OG title</p>
        </div>
      </div>

      {/* ── Table ── */}
      {items.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-zinc-800/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800/50 bg-zinc-900/30">
                <th className="text-left px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">Сутность</th>
                <th className="text-center px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider hidden sm:table-cell">Локаль</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">Title</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider hidden md:table-cell">Description</th>
                <th className="text-center px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider hidden lg:table-cell">Score</th>
                <th className="text-center px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">Robots</th>
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {items.map((meta) => (
                <tr key={meta.id} className="hover:bg-zinc-900/30 transition-colors duration-150 group">
                  <td className="px-4 py-3">
                    <Link
                      href={getEntityEditUrl(meta.entityType, meta.entityId, meta.id)}
                      className="text-zinc-200 hover:text-gold transition-colors duration-200 font-medium"
                    >
                      {ENTITY_LABELS[meta.entityType] ?? meta.entityType}
                    </Link>
                    <p className="text-[10px] text-zinc-600 mt-0.5 font-mono">ID: {meta.entityId.slice(0, 8)}…</p>
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      meta.locale === 'ru'
                        ? 'bg-blue-900/30 text-blue-400'
                        : 'bg-amber-900/30 text-amber-400'
                    }`}>
                      {meta.locale === 'ru' ? 'RU' : 'UK'}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-[250px]">
                    <p className="text-zinc-300 truncate" title={meta.title ?? ''}>
                      {meta.title ?? <span className="text-red-400/60 italic">Нет title</span>}
                    </p>
                  </td>
                  <td className="px-4 py-3 max-w-[300px] hidden md:table-cell">
                    <p className="text-zinc-400 truncate" title={meta.description ?? ''}>
                      {meta.description ?? <span className="text-amber-400/60 italic">Нет описания</span>}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    {(() => {
                      const scoreResult = calculateSeoScore({
                        title: meta.title,
                        description: meta.description,
                        ogImageId: meta.ogImageId,
                        canonicalPath: meta.canonicalPath,
                        robotsIndex: meta.robotsIndex,
                        robotsFollow: meta.robotsFollow,
                      })
                      const colorClass = scoreResult.score >= 80 ? 'text-green-400' : scoreResult.score >= 60 ? 'text-amber-400' : scoreResult.score >= 40 ? 'text-orange-400' : 'text-red-400'
                      const dotColor = scoreResult.score >= 80 ? 'bg-green-500' : scoreResult.score >= 60 ? 'bg-amber-500' : scoreResult.score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                      return (
                        <div className="inline-flex items-center gap-1.5" title={`${scoreResult.issues.length} проблем`}>
                          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                          <span className={`text-xs font-medium ${colorClass}`}>{scoreResult.score}</span>
                        </div>
                      )
                    })()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 text-xs ${
                      meta.robotsIndex ? 'text-green-400' : 'text-zinc-500'
                    }`}>
                      {meta.robotsIndex ? <Eye className="w-3 h-3" aria-hidden="true" /> : <EyeOff className="w-3 h-3" aria-hidden="true" />}
                      {meta.robotsIndex ? 'On' : 'Off'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/seo/${meta.id}`}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 inline-flex items-center justify-center w-7 h-7 rounded-lg hover:bg-zinc-800/50"
                      aria-label="Редактировать SEO"
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
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/20 p-12 text-center">
          <Search className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-base font-medium text-zinc-300 mb-1">Нет SEO-записей</h3>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto">
            {dbAvailable
              ? 'SEO-метаданные создаются автоматически при создании контента.'
              : 'База данных недоступна.'}
          </p>
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
