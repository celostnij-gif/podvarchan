import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

export const seoMeta = sqliteTable('seo_meta', {
  id: text('id').primaryKey(),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  locale: text('locale', { enum: ['ru', 'uk'] }),
  title: text('title'),
  description: text('description'),
  keywords: text('keywords'),
  canonicalPath: text('canonical_path'),
  ogTitle: text('og_title'),
  ogDescription: text('og_description'),
  ogImageId: text('og_image_id'),
  robotsIndex: integer('robots_index', { mode: 'boolean' }).default(true),
  robotsFollow: integer('robots_follow', { mode: 'boolean' }).default(true),
  schemaType: text('schema_type'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => ({
  entityIdx: index('idx_seo_entity').on(table.entityType, table.entityId, table.locale),
}))
