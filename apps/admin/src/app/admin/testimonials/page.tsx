import { getDB } from '@/db'
import { testimonials } from '@/db/schema/testimonials'
import { eq } from 'drizzle-orm'
import Link from 'next/link'
import { TestimonialsSortableList } from './testimonials-sortable-list'

export default async function TestimonialsListPage() {
  const db = getDB()
  const rows = await db
    .select()
    .from(testimonials)
    .orderBy(testimonials.sortOrder)
    .all()

  const items = rows.map((t) => ({
    id: t.id,
    clientName: t.clientName,
    status: t.status,
    rating: t.rating,
    sortOrder: t.sortOrder,
  }))

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-100">Відгуки</h1>
        <Link href="/admin/testimonials/new"
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">+ Новий відгук</Link>
      </div>
      <TestimonialsSortableList items={items} />
    </div>
  )
}
