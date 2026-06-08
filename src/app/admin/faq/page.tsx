/**
 * Сторінка списку FAQ (/admin/faq).
 * Показує таблицю з питанням, групою, статусом та порядком.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus, HelpCircle, ArrowRight } from 'lucide-react'
import { getFaqItems } from '@/lib/actions/faq'
import { StatusBadge } from '@/components/admin'

export const metadata: Metadata = {
  title: 'FAQ',
}

/* ── Types ── */

interface FaqRow {
  id: string
  group: string
  serviceId: string | null
  status: string
  sortOrder: number
  questionRu: string | null
}

/* ── Helpers ── */

const GROUP_LABELS: Record<string, string> = {
  HOME: 'Главная',
  GENERAL: 'Общие',
  SERVICE: 'Услуги',
  CONTACTS: 'Контакты',
}

function pluralize(n: number): string {
  if (n === 1) return 'вопрос'
  if (n >= 2 && n <= 4) return 'вопроса'
  return 'вопросов'
}

/* ── Page ── */

export default async function FaqPage() {
  const result = await getFaqItems()
  const items = (result.success ? result.data : []) as FaqRow[]
  const dbAvailable = result.success

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">FAQ</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {items.length} {pluralize(items.length)}
          </p>
        </div>
        {dbAvailable && (
          <Link
            href="/admin/faq/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 transition-all duration-200 text-sm font-medium"
            aria-label="Создать новый вопрос"
          >
            <Plus className="w-4 h-4" />
            Создать вопрос
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
                  Вопрос
                </th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider hidden md:table-cell">
                  Группа
                </th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">
                  Статус
                </th>
                <th className="text-center px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider hidden sm:table-cell">
                  Порядок
                </th>
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-zinc-900/30 transition-colors duration-150 group"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/faq/${item.id}`}
                      className="text-zinc-200 hover:text-gold transition-colors duration-200 font-medium"
                    >
                      {item.questionRu ?? `FAQ #${item.sortOrder}`}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs hidden md:table-cell">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-zinc-800/50 text-zinc-400 text-[11px]">
                      {GROUP_LABELS[item.group] ?? item.group}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status === 'PUBLISHED' ? 'published' : 'draft'} />
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <span className="text-xs text-zinc-500">{item.sortOrder}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/faq/${item.id}`}
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
          <HelpCircle className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-base font-medium text-zinc-300 mb-1">Нет вопросов</h3>
          <p className="text-sm text-zinc-500 mb-6 max-w-sm mx-auto">
            {dbAvailable
              ? 'Создайте первый вопрос, чтобы начать работу с модулем FAQ.'
              : 'База данных недоступна. Подключите D1 для просмотра FAQ.'}
          </p>
          {dbAvailable && (
            <Link
              href="/admin/faq/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 transition-all duration-200 text-sm font-medium"
              aria-label="Создать новый вопрос"
            >
              <Plus className="w-4 h-4" />
              Создать вопрос
            </Link>
          )}
        </div>
      )}

      {/* ── D1 unavailable banner ── */}
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
