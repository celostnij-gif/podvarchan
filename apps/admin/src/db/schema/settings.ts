import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const siteSettings = sqliteTable('site_settings', {
  key: text('key').primaryKey(),
  valueJson: text('value_json'),
  updatedById: text('updated_by_id'),
  updatedAt: text('updated_at'),
})

export const contactChannels = sqliteTable('contact_channels', {
  id: text('id').primaryKey(),
  type: text('type', { enum: ['TELEGRAM', 'WHATSAPP', 'EMAIL', 'PHONE', 'CUSTOM'] }).notNull(),
  label: text('label'),
  value: text('value'),
  url: text('url'),
  isPrimary: integer('is_primary', { mode: 'boolean' }).notNull().default(false),
  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const navigationItems = sqliteTable('navigation_items', {
  id: text('id').primaryKey(),
  location: text('location', { enum: ['HEADER', 'FOOTER', 'MOBILE'] }).notNull(),
  parentId: text('parent_id'),
  href: text('href'),
  labelRu: text('label_ru'),
  labelUk: text('label_uk'),
  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const redirectRules = sqliteTable('redirect_rules', {
  id: text('id').primaryKey(),
  fromPath: text('from_path').notNull(),
  toPath: text('to_path').notNull(),
  statusCode: integer('status_code').notNull().default(301),
  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
  hitCount: integer('hit_count').notNull().default(0),
  createdAt: text('created_at').notNull(),
})
