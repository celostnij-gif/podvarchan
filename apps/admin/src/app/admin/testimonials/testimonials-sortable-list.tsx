'use client'

import Link from 'next/link'
import { SortableList } from '@/components/admin/SortableList'
import { reorderTestimonials } from '@/lib/actions/testimonials'

interface TestimonialRow {
  id: string
  clientName: string | null
  status: string
  rating: number | null
  sortOrder: number
}

function StatusBadge({ status }: { status: string }) {
  const s: Record<string, string> = { PUBLISHED: 'bg-green-900/30 text-green-400 border border-green-700/30', DRAFT: 'bg-amber-900/30 text-amber-400 border border-amber-700/30', HIDDEN: 'bg-zinc-800 text-zinc-400 border border-zinc-700/50' }
  const l: Record<string, string> = { PUBLISHED: 'Опубліковано', DRAFT: 'Чернетка', HIDDEN: 'Приховано' }
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${s[status] ?? s.DRAFT}`}>{l[status] ?? status}</span>
}

export function TestimonialsSortableList({ items }: { items: TestimonialRow[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 py-16 text-center">
        <p className="text-sm text-zinc-500">Відгуків ще немає.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40">
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-b border-zinc-800 px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
        <span>Клієнт</span>
        <span>Статус</span>
        <span>Рейтинг</span>
        <span className="text-right">Дії</span>
      </div>
      <SortableList items={items} onReorder={reorderTestimonials}>
        {(item) => (
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-3 text-sm transition-colors hover:bg-zinc-800/40">
            <span className="truncate text-zinc-200">{item.clientName ?? '—'}</span>
            <StatusBadge status={item.status} />
            <span className="text-zinc-400">{item.rating ? '★'.repeat(item.rating) : '—'}</span>
            <div className="text-right">
              <Link href={`/admin/testimonials/${item.id}`} className="rounded px-2 py-1 text-amber-400 hover:bg-zinc-800">
                Редагувати
              </Link>
            </div>
          </div>
        )}
      </SortableList>
    </div>
  )
}
