import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

export const pages = sqliteTable('pages', {
  id: text('id').primaryKey(),
  // PRICING exists in production D1; slug_pattern column does NOT (do not re-add without migration)
  type: text('type', {
    enum: ['HOME', 'METHOD', 'ABOUT', 'FAQ', 'CONTACTS', 'PRIVACY', 'DISCLAIMER', 'PRICING', 'CUSTOM'],
  }).notNull(),
  status: text('status', { enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] }).notNull().default('DRAFT'),
  sortOrder: integer('sort_order').notNull().default(0),
  publishedAt: text('published_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const pageTranslations = sqliteTable('page_translations', {
  id: text('id').primaryKey(),
  pageId: text('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  locale: text('locale', { enum: ['ru', 'uk'] }).notNull(),
  slug: text('slug').notNull(),
  title: text('title'),
  excerpt: text('excerpt'),
  contentJson: text('content_json'),
  seoMetaId: text('seo_meta_id'),
}, (table) => ({
  pageLocaleIdx: index('idx_page_trans_page_loc').on(table.pageId, table.locale),
}))

export const pageSections = sqliteTable('page_sections', {
  id: text('id').primaryKey(),
  pageId: text('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  key: text('key').notNull(),
  type: text('type', {
    enum: ['hero', 'text-block', 'image-text', 'stats', 'timeline', 'gallery',
           'video-embed', 'services-grid', 'faq-group-ref', 'testimonials-ref',
           'cta', 'contact-form'],
  }).notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  settingsJson: text('settings_json'),
})

export const pageSectionTranslations = sqliteTable('page_section_translations', {
  id: text('id').primaryKey(),
  sectionId: text('section_id').notNull().references(() => pageSections.id, { onDelete: 'cascade' }),
  locale: text('locale', { enum: ['ru', 'uk'] }).notNull(),
  contentJson: text('content_json'),
}, (table) => ({
  secLocaleIdx: index('idx_psect_trans_sec_loc').on(table.sectionId, table.locale),
}))
