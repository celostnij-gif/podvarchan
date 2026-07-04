import { getDB } from '@/db'
import { blogPosts, blogPostTranslations } from '@/db/schema/blog'
import { blogCategories, blogCategoryTranslations } from '@/db/schema/blog'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { PostForm } from '../post-form'
import type { PostWithTranslations } from '../../types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditPostPage(props: Props) {
  const { id } = await props.params
  const db = getDB()

  const rows = await db
    .select()
    .from(blogPosts)
    .leftJoin(blogPostTranslations, eq(blogPosts.id, blogPostTranslations.postId))
    .where(eq(blogPosts.id, id))
    .all()

  if (rows.length === 0) notFound()

  const post: PostWithTranslations = {
    ...rows[0].blog_posts,
    translations: rows.map((r) => r.blog_post_translations).filter(Boolean) as PostWithTranslations['translations'],
    categorySlug: null,
  }

  const catRows = await db
    .select()
    .from(blogCategories)
    .leftJoin(blogCategoryTranslations, eq(blogCategories.id, blogCategoryTranslations.categoryId))
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
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Редагувати пост</h1>
      <PostForm post={post} categories={Array.from(grouped.values())} />
    </div>
  )
}
