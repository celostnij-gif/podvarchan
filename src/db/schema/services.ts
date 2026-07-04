import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

export const services = sqliteTable('services', {
  id: text('id').primaryKey(),
  slugBase: text('slug_base').notNull().unique(),
  icon: text('icon'),
  category: text('category'),
  priority: integer('priority').notNull().default(0),
  status: text('status', { enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] }).notNull().default('DRAFT'),
  featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const serviceTranslations = sqliteTable('service_translations', {
  id: text('id').primaryKey(),
  serviceId: text('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  locale: text('locale', { enum: ['ru', 'uk'] }).notNull(),
  slug: text('slug').notNull(),
  title: text('title'),
  shortTitle: text('short_title'),
  description: text('description'),
  heroTitle: text('hero_title'),
  heroSubtitle: text('hero_subtitle'),
  symptomsJson: text('symptoms_json'),
  processJson: text('process_json'),
  benefitsJson: text('benefits_json'),
  faqJson: text('faq_json'),
  ctaText: text('cta_text'),
  seoMetaId: text('seo_meta_id'),
}, (table) => ({
  serviceLocaleIdx: index('idx_serv_trans_svc_loc').on(table.serviceId, table.locale),
}))

export const serviceRelations = null
