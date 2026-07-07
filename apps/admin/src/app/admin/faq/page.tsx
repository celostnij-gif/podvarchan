import { getDB } from '@/db'
import { faqItems, faqItemTranslations } from '@/db/schema/faq'
import { eq } from 'drizzle-orm'
import Link from 'next/link'

export default async function FaqListPage() {
  const db = getDB()
  const rows = await db
    .select()
    .from(faqItems)
    .leftJoin(faqItemTranslations, eq(faqItems.id, faqItemTranslations.faqItemId))
    .all()

  const grouped = new Map<string, { item: typeof rows[number]['faq_items']; tr: NonNullable<typeof rows[number]['faq_item_translations']>[] }>()
  for (const row of rows) {
    if (!grouped.has(row.faq_items.id)) {
      grouped.set(row.faq_items.id, { item: row.faq_items, tr: [] })
    }
    if (row.faq_item_translations) {
      grouped.get(row.faq_items.id)!.tr.push(row.faq_item_translations)
    }
  }
  const all = Array.from(grouped.values())

  const groupLabels: Record<string, string> = { HOME: 'Головна', GENERAL: 'Загальні', SERVICE: 'Послуги', CONTACTS: 'Контакти' }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">FAQ</h1>
        <Link href="/admin/faq/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">+ Новий FAQ</Link>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Група</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Питання (RU)</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Статус</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Порядок</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {all.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">FAQ ще немає.</td></tr>
            ) : all.map(({ item, tr }) => {
              const ru = tr.find(t => t.locale === 'ru')
              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{groupLabels[item.group] ?? item.group}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-xs truncate">{ru?.question ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3"><StatusBadge status={item.status} /></td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{item.sortOrder}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    <Link href={`/admin/faq/${item.id}`} className="rounded px-2 py-1 text-blue-600 hover:bg-blue-50">Редагувати</Link>
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
  const s: Record<string, string> = { PUBLISHED: 'bg-green-100 text-green-800', DRAFT: 'bg-yellow-100 text-yellow-800' }
  const l: Record<string, string> = { PUBLISHED: 'Опубліковано', DRAFT: 'Чернетка' }
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${s[status] ?? s.DRAFT}`}>{l[status] ?? status}</span>
}
