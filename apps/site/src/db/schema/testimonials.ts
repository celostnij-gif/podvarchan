import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

export const testimonials = sqliteTable('testimonials', {
  id: text('id').primaryKey(),
  status: text('status', { enum: ['DRAFT', 'PUBLISHED', 'HIDDEN'] }).notNull().default('DRAFT'),
  clientName: text('client_name'),
  clientAge: integer('client_age'),
  avatarInitials: text('avatar_initials'),
  rating: integer('rating'),
  source: text('source'),
  consentConfirmed: integer('consent_confirmed', { mode: 'boolean' }).notNull().default(false),
  publishedAt: text('published_at'),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const testimonialTranslations = sqliteTable('testimonial_translations', {
  id: text('id').primaryKey(),
  testimonialId: text('testimonial_id').notNull().references(() => testimonials.id, { onDelete: 'cascade' }),
  locale: text('locale', { enum: ['ru', 'uk'] }).notNull(),
  problem: text('problem'),
  result: text('result'),
  text: text('text'),
}, (table) => ({
  testimonialLocaleIdx: index('idx_testim_trans_tid_loc').on(table.testimonialId, table.locale),
}))
