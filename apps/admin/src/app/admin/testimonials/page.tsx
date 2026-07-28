import { getDB } from '@/db'
import { testimonials } from '@/db/schema/testimonials'
import { sql } from 'drizzle-orm'
import Link from 'next/link'
import { TestimonialsSortableList } from './testimonials-sortable-list'
import Pagination from '@/components/admin/Pagination'

interface Props {
  searchParams: Promise<{ page?: string }>
}

export default async function TestimonialsListPage(props: Props) {
  const db = getDB()
  const params = await props.searchParams
  const page = Number(params.page) || 1
  const PAGE_SIZE = 20
  const offset = (page - 1) * PAGE_SIZE

  const total = await db
    .select({ count: sql<number>`count(DISTINCT ${testimonials.id})` })
    .from(testimonials)
    .get()
  const totalPages = Math.ceil((total?.count ?? 0) / PAGE_SIZE)
  const rows = await db
    .select()
    .from(testimonials)
    .orderBy(testimonials.sortOrder)
    .limit(PAGE_SIZE)
    .offset(offset)
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
      <Pagination currentPage={page} totalPages={totalPages} baseUrl="/admin/testimonials" />
    </div>
  )
}
