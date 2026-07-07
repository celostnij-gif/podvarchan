import { getDB } from '@/db'
import { testimonials, testimonialTranslations } from '@/db/schema/testimonials'
import { eq } from 'drizzle-orm'
import Link from 'next/link'

export default async function TestimonialsListPage() {
  const db = getDB()
  const rows = await db
    .select()
    .from(testimonials)
    .leftJoin(testimonialTranslations, eq(testimonials.id, testimonialTranslations.testimonialId))
    .orderBy(testimonials.sortOrder)
    .all()

  const grouped = new Map<string, { t: typeof rows[number]['testimonials']; tr: NonNullable<typeof rows[number]['testimonial_translations']>[] }>()
  for (const row of rows) {
    if (!grouped.has(row.testimonials.id)) {
      grouped.set(row.testimonials.id, { t: row.testimonials, tr: [] })
    }
    if (row.testimonial_translations) {
      grouped.get(row.testimonials.id)!.tr.push(row.testimonial_translations)
    }
  }
  const all = Array.from(grouped.values())

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Відгуки</h1>
        <Link href="/admin/testimonials/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">+ Новий відгук</Link>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Статус</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Клієнт</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Рейтинг</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Порядок</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {all.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">Відгуків ще немає.</td></tr>
            ) : all.map(({ t }) => {
              return (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{t.clientName ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{t.rating ? '★'.repeat(t.rating) : '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{t.sortOrder}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    <Link href={`/admin/testimonials/${t.id}`} className="rounded px-2 py-1 text-blue-600 hover:bg-blue-50">Редагувати</Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const s: Record<string, string> = { PUBLISHED: 'bg-green-100 text-green-800', DRAFT: 'bg-yellow-100 text-yellow-800', HIDDEN: 'bg-gray-100 text-gray-600' }
  const l: Record<string, string> = { PUBLISHED: 'Опубліковано', DRAFT: 'Чернетка', HIDDEN: 'Приховано' }
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${s[status] ?? s.DRAFT}`}>{l[status] ?? status}</span>
}
