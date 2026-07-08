import { getDB } from '@/db'
import { blogCategories, blogCategoryTranslations } from '@/db/schema/blog'
import { eq } from 'drizzle-orm'
import { PostForm } from '../post-form'

export default async function NewPostPage() {
  const db = getDB()

  const catRows = await db
    .select()
    .from(blogCategories)
    .leftJoin(blogCategoryTranslations, eq(blogCategories.id, blogCategoryTranslations.categoryId))
    .where(eq(blogCategories.status, 'PUBLISHED'))
    .all()

  const grouped = new Map<string, { id: string; slugBase: string; ruName?: string }>()
  for (const row of catRows) {
    if (!grouped.has(row.blog_categories.id)) {
      grouped.set(row.blog_categories.id, { id: row.blog_categories.id, slugBase: row.blog_categories.slugBase })
    }
    const entry = grouped.get(row.blog_categories.id)!
    if (row.blog_category_translations?.locale === 'ru' && row.blog_category_translations.name) {
      entry.ruName = row.blog_category_translations.name
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Новий пост</h1>
      <PostForm categories={Array.from(grouped.values())} />
    </div>
  )
}
