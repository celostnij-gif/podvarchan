'use client'

import ViewOnSiteLink from '@/components/admin/ViewOnSiteLink'

import Link from 'next/link'
import { SortableList } from '@/components/admin/SortableList'
import { reorderServices } from '@/lib/actions/services'
import { PublishButton } from './publish-button'
import { DeleteButton } from './delete-button'

interface ServiceRow {
  id: string
  slugBase: string
  status: string
  category: string | null
  priority: number
  titleRu: string | null
  titleUk: string | null
}

function StatusBadge({ status }: { status: string }) {
  const s: Record<string, string> = { PUBLISHED: 'bg-green-900/30 text-green-400 border border-green-700/30', DRAFT: 'bg-amber-900/30 text-amber-400 border border-amber-700/30', ARCHIVED: 'bg-zinc-800 text-zinc-400 border border-zinc-700/50' }
  const l: Record<string, string> = { PUBLISHED: 'Опубліковано', DRAFT: 'Чернетка', ARCHIVED: 'Архів' }
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${s[status] ?? s.DRAFT}`}>{l[status] ?? status}</span>
}

export function ServicesSortableList({ items }: { items: ServiceRow[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 py-16 text-center">
        <p className="text-sm text-zinc-500">
          Послуг ще немає.{' '}
          <Link href="/admin/services/new" className="text-amber-400 hover:underline">
            Створити першу
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40">
      <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 border-b border-zinc-800 px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
        <span>Назва (RU)</span>
        <span>Категорія</span>
        <span>Пріоритет</span>
        <span>Статус</span>
        <span className="text-right">Дії</span>
      </div>
      <SortableList items={items} onReorder={reorderServices}>
        {(item) => (
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-4 py-3 text-sm transition-colors hover:bg-zinc-800/40">
            <div className="min-w-0">
              <span className="truncate text-zinc-200">{item.titleRu ?? '—'}</span>
              {item.titleUk && <span className="ml-2 text-xs text-zinc-600">/ {item.titleUk}</span>}
            </div>
            <span className="text-zinc-500">{item.category || '—'}</span>
            <span className="text-zinc-400">{item.priority}</span>
            <StatusBadge status={item.status} />
            <div className="flex items-center justify-end gap-1">
              <PublishButton id={item.id} status={item.status} />
              <Link href={`/admin/services/${item.id}`} className="rounded px-2 py-1 text-amber-400 hover:bg-zinc-800">
                Ред
              </Link>
              {item.status === 'PUBLISHED' && item.slugBase && (
                <>
                  <ViewOnSiteLink href={`/ru/uslugi/${item.slugBase}`} label="RU" />
                  <ViewOnSiteLink href={`/uk/uslugi/${item.slugBase}`} label="UK" />
                </>
              )}
              <DeleteButton id={item.id} />
            </div>
          </div>
        )}
      </SortableList>
    </div>
  )
}
