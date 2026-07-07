import { getDB } from '@/db'
import { blogCategories, blogCategoryTranslations } from '@/db/schema/blog'
import { services, serviceTranslations } from '@/db/schema/services'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { CategoryForm } from '../category-form'
import type { CategoryWithTranslations } from '../../types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditCategoryPage(props: Props) {
  const { id } = await props.params
  const db = getDB()

  const rows = await db
    .select()
    .from(blogCategories)
    .leftJoin(blogCategoryTranslations, eq(blogCategories.id, blogCategoryTranslations.categoryId))
    .where(eq(blogCategories.id, id))
    .all()

  if (rows.length === 0) notFound()

  const category: CategoryWithTranslations = {
    ...rows[0].blog_categories,
    translations: rows.map((r) => r.blog_category_translations).filter(Boolean) as CategoryWithTranslations['translations'],
  }

  const svcRows = await db.select().from(services)
    .leftJoin(serviceTranslations, eq(services.id, serviceTranslations.serviceId)).all()

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
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Редагувати: {category.slugBase}</h1>
      <CategoryForm category={category} services={Array.from(grouped.values())} />
    </div>
  )
}
