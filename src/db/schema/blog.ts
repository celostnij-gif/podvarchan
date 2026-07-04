import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

export const blogCategories = sqliteTable('blog_categories', {
  id: text('id').primaryKey(),
  slugBase: text('slug_base').notNull().unique(),
  serviceId: text('service_id'),
  sortOrder: integer('sort_order').notNull().default(0),
  status: text('status', { enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] }).notNull().default('DRAFT'),
})

export const blogCategoryTranslations = sqliteTable('blog_category_translations', {
  id: text('id').primaryKey(),
  categoryId: text('category_id').notNull().references(() => blogCategories.id, { onDelete: 'cascade' }),
  locale: text('locale', { enum: ['ru', 'uk'] }).notNull(),
  slug: text('slug').notNull(),
  name: text('name'),
  description: text('description'),
  seoMetaId: text('seo_meta_id'),
}, (table) => ({
  catLocaleIdx: index('idx_bcat_trans_cat_loc').on(table.categoryId, table.locale),
}))

export const blogPosts = sqliteTable('blog_posts', {
  id: text('id').primaryKey(),
  categoryId: text('category_id').references(() => blogCategories.id, { onDelete: 'set null' }),
  authorId: text('author_id'),
  status: text('status', { enum: ['DRAFT', 'REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'] }).notNull().default('DRAFT'),
  coverImageId: text('cover_image_id'),
  readingMinutes: integer('reading_minutes'),
  publishedAt: text('published_at'),
  scheduledAt: text('scheduled_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const blogPostTranslations = sqliteTable('blog_post_translations', {
  id: text('id').primaryKey(),
  postId: text('post_id').notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
  locale: text('locale', { enum: ['ru', 'uk'] }).notNull(),
  slug: text('slug').notNull(),
  title: text('title'),
  excerpt: text('excerpt'),
  contentJson: text('content_json'),
  contentHtml: text('content_html'),
  tableOfContentsJson: text('table_of_contents_json'),
  faqJson: text('faq_json'),
  seoMetaId: text('seo_meta_id'),
}, (table) => ({
  postLocaleIdx: index('idx_bpost_trans_post_loc').on(table.postId, table.locale),
}))
