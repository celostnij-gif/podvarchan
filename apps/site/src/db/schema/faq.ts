import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

export const faqItems = sqliteTable('faq_items', {
  id: text('id').primaryKey(),
  group: text('group', { enum: ['HOME', 'GENERAL', 'SERVICE', 'CONTACTS'] }).notNull().default('GENERAL'),
  serviceId: text('service_id'),
  status: text('status', { enum: ['DRAFT', 'PUBLISHED'] }).notNull().default('DRAFT'),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const faqItemTranslations = sqliteTable('faq_item_translations', {
  id: text('id').primaryKey(),
  faqItemId: text('faq_item_id').notNull().references(() => faqItems.id, { onDelete: 'cascade' }),
  locale: text('locale', { enum: ['ru', 'uk'] }).notNull(),
  question: text('question'),
  answer: text('answer'),
}, (table) => ({
  faqLocaleIdx: index('idx_faq_trans_item_loc').on(table.faqItemId, table.locale),
}))
