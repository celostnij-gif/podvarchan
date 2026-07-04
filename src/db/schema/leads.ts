import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const contactLeads = sqliteTable('contact_leads', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email'),
  phone: text('phone'),
  message: text('message'),
  sourcePage: text('source_page'),
  locale: text('locale', { enum: ['ru', 'uk'] }),
  status: text('status', { enum: ['NEW', 'IN_PROGRESS', 'CONTACTED', 'BOOKED', 'CLOSED', 'SPAM'] }).notNull().default('NEW'),
  internalNote: text('internal_note'),
  ipHash: text('ip_hash'),
  userAgent: text('user_agent'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const leadEvents = sqliteTable('lead_events', {
  id: text('id').primaryKey(),
  leadId: text('lead_id').notNull().references(() => contactLeads.id, { onDelete: 'cascade' }),
  userId: text('user_id'),
  type: text('type'),
  note: text('note'),
  createdAt: text('created_at').notNull(),
})
