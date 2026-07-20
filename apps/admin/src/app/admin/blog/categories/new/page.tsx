import { getDB } from '@/db'
import { services, serviceTranslations } from '@/db/schema/services'
import { eq } from 'drizzle-orm'
import { CategoryForm } from '../category-form'

export default async function NewCategoryPage() {
  const db = getDB()
  const svcRows = await db
    .select()
    .from(services)
    .leftJoin(serviceTranslations, eq(services.id, serviceTranslations.serviceId))
    .all()

  const grouped = new Map<string, { id: string; slugBase: string; ruTitle?: string }>()
  for (const row of svcRows) {
    if (!grouped.has(row.services.id)) {
      grouped.set(row.services.id, { id: row.services.id, slugBase: row.services.slugBase })
    }
    const entry = grouped.get(row.services.id)!
    if (row.service_translations?.locale === 'ru' && row.service_translations.title) {
      entry.ruTitle = row.service_translations.title
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-200">Нова категорія</h1>
      <CategoryForm services={Array.from(grouped.values())} />
    </div>
  )
}
