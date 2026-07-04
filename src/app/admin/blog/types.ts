import type { blogCategories, blogCategoryTranslations, blogPosts, blogPostTranslations } from '@/db/schema/blog'

export type BlogCategory = typeof blogCategories.$inferSelect
export type BlogCategoryTranslation = typeof blogCategoryTranslations.$inferSelect
export type BlogPost = typeof blogPosts.$inferSelect
export type BlogPostTranslation = typeof blogPostTranslations.$inferSelect

export interface CategoryWithTranslations extends BlogCategory {
  translations: BlogCategoryTranslation[]
  serviceSlug?: string | null
}

export interface PostWithTranslations extends BlogPost {
  translations: BlogPostTranslation[]
  categorySlug?: string | null
}
