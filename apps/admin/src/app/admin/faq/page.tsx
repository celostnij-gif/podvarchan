import { getDB } from '@/db'
import { faqItems, faqItemTranslations } from '@/db/schema/faq'
import { eq, sql } from 'drizzle-orm'
import Link from 'next/link'
import Pagination from '@/components/admin/Pagination'
import { FaqSortableList } from './faq-sortable-list'

export default async function FaqListPage(props: { searchParams: Promise<{ page?: string }> }) {
  const page = Number((await props.searchParams).page) || 1
  const PAGE_SIZE = 20
  const offset = (page - 1) * PAGE_SIZE
  const db = getDB()

  const { count: total } = await db
    .select({ count: sql<number>`count(DISTINCT ${faqItems.id})` })
    .from(faqItems)
    .leftJoin(faqItemTranslations, eq(faqItems.id, faqItemTranslations.faqItemId))
    .get() ?? { count: 0 }
  const totalPages = Math.ceil((total ?? 0) / PAGE_SIZE)

  const rows = await db
    .select()
    .from(faqItems)
    .leftJoin(faqItemTranslations, eq(faqItems.id, faqItemTranslations.faqItemId))
    .orderBy(faqItems.sortOrder)
    .limit(PAGE_SIZE)
    .offset(offset)
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

  const items = all.map(({ item, tr }) => ({
    id: item.id,
    group: item.group,
    status: item.status,
    sortOrder: item.sortOrder,
    questionRu: tr.find(t => t.locale === 'ru')?.question ?? null,
  }))
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-100">FAQ</h1>
        <Link href="/admin/faq/new"
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">+ Новий FAQ</Link>
      </div>
      <FaqSortableList items={items} />
      <Pagination currentPage={page} totalPages={totalPages} baseUrl="/admin/faq" />
    </div>
  )
}
