import PreviewButton from '@/components/admin/PreviewButton'
import { getDB } from '@/db'
import { faqItems, faqItemTranslations } from '@/db/schema/faq'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { FaqForm } from '../faq-form'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditFaqPage(props: Props) {
  const { id } = await props.params
  const db = getDB()

  const rows = await db
    .select()
    .from(faqItems)
    .leftJoin(faqItemTranslations, eq(faqItems.id, faqItemTranslations.faqItemId))
    .where(eq(faqItems.id, id))
    .all()

  if (rows.length === 0) notFound()

  const faq = {
    ...rows[0].faq_items,
    translations: rows.map(r => r.faq_item_translations).filter((t): t is NonNullable<typeof t> => t !== null),
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-200">Редагувати FAQ</h1>
        <PreviewButton
          entityType="faq"
          slug="list"
          publicPath="/ru/faq/"
        />
      </div>
      <FaqForm faq={faq} />
    </div>
  )
}
