import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const contentRevisions = sqliteTable('content_revisions', {
  id: text('id').primaryKey(),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  locale: text('locale', { enum: ['ru', 'uk'] }),
  dataJson: text('data_json'),
  createdById: text('created_by_id'),
  createdAt: text('created_at').notNull(),
  label: text('label'),
})
