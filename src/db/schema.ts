import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core'
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'

/* ═══════════════════════════════════════
   UTILITY
   ═══════════════════════════════════════ */

function id() {
  return text('id').primaryKey()
}

function updatedAt() {
  return integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date())
}

// ── Timestamp that is set once on creation and never updated ──
function createdAtFixed() {
  return integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date())
}

/* ═══════════════════════════════════════
   1. USERS & AUTH
   ═══════════════════════════════════════ */

export const users = sqliteTable('users', {
  id: id(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role', { enum: ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER'] }).notNull().default('VIEWER'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp_ms' }),
  createdAt: createdAtFixed(),
  updatedAt: updatedAt(),
})

export const auditLogs = sqliteTable('audit_logs', {
  id: id(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'set null' }),
  action: text('action', {
    enum: ['CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'UNPUBLISH', 'LOGIN', 'LOGOUT', 'UPLOAD', 'SETTINGS_CHANGE'],
  }).notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id'),
  beforeJson: text('before_json'),
  afterJson: text('after_json'),
  ip: text('ip'),
  userAgent: text('user_agent'),
  createdAt: createdAtFixed(),
})

/* ═══════════════════════════════════════
   2. SEO
   ═══════════════════════════════════════ */

export const seoMeta = sqliteTable('seo_meta', {
  id: id(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  locale: text('locale', { enum: ['ru', 'uk'] }).notNull(),
  title: text('title'),
  description: text('description'),
  keywords: text('keywords'), // comma-separated
  canonicalPath: text('canonical_path'),
  ogTitle: text('og_title'),
  ogDescription: text('og_description'),
  ogImageId: text('og_image_id'),
  robotsIndex: integer('robots_index', { mode: 'boolean' }).notNull().default(true),
  robotsFollow: integer('robots_follow', { mode: 'boolean' }).notNull().default(true),
  schemaType: text('schema_type'),
  createdAt: createdAtFixed(),
  updatedAt: updatedAt(),
}, (table) => ({
  entityIdx: uniqueIndex('seo_meta_entity_idx').on(table.entityType, table.entityId, table.locale),
}))

/* ═══════════════════════════════════════
   3. PAGES
   ═══════════════════════════════════════ */

export const pages = sqliteTable('pages', {
  id: id(),
  type: text('type', { enum: ['HOME', 'METHOD', 'ABOUT', 'FAQ', 'CONTACTS', 'PRIVACY', 'DISCLAIMER', 'PRICING', 'CUSTOM'] }).notNull(),
  status: text('status', { enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] }).notNull().default('DRAFT'),
  sortOrder: integer('sort_order').notNull().default(0),
  publishedAt: integer('published_at', { mode: 'timestamp_ms' }),
  createdAt: createdAtFixed(),
  updatedAt: updatedAt(),
})

export const pageTranslations = sqliteTable('page_translations', {
  id: id(),
  pageId: text('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  locale: text('locale', { enum: ['ru', 'uk'] }).notNull(),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  excerpt: text('excerpt'),
  contentJson: text('content_json'), // JSON string
  seoMetaId: text('seo_meta_id').references(() => seoMeta.id),
}, (table) => ({
  pageLocaleIdx: uniqueIndex('page_translations_idx').on(table.pageId, table.locale),
}))

export const pageSections = sqliteTable('page_sections', {
  id: id(),
  pageId: text('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  key: text('key').notNull(),
  type: text('type').notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  settingsJson: text('settings_json'), // JSON: { background, alignment, itemCount, showCta }
})

export const pageSectionTranslations = sqliteTable('page_section_translations', {
  id: id(),
  sectionId: text('section_id').notNull().references(() => pageSections.id, { onDelete: 'cascade' }),
  locale: text('locale', { enum: ['ru', 'uk'] }).notNull(),
  contentJson: text('content_json'), // JSON string
}, (table) => ({
  sectionLocaleIdx: uniqueIndex('page_section_translations_idx').on(table.sectionId, table.locale),
}))

/* ═══════════════════════════════════════
   4. SERVICES
   ═══════════════════════════════════════ */

export const services = sqliteTable('services', {
  id: id(),
  slugBase: text('slug_base').notNull().unique(),
  icon: text('icon'), // emoji
  category: text('category'),
  priority: integer('priority').notNull().default(3),
  featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
  status: text('status', { enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] }).notNull().default('DRAFT'),
  sortOrder: integer('sort_order').notNull().default(0),
  publishedAt: integer('published_at', { mode: 'timestamp_ms' }),
  createdAt: createdAtFixed(),
  updatedAt: updatedAt(),
})

export const serviceTranslations = sqliteTable('service_translations', {
  id: id(),
  serviceId: text('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  locale: text('locale', { enum: ['ru', 'uk'] }).notNull(),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  shortTitle: text('short_title'),
  description: text('description'),
  heroTitle: text('hero_title'),
  heroSubtitle: text('hero_subtitle'),
  symptomsJson: text('symptoms_json'), // JSON array
  processJson: text('process_json'),   // JSON array of steps
  benefitsJson: text('benefits_json'), // JSON array
  faqJson: text('faq_json'),           // JSON array of {question, answer}
  ctaText: text('cta_text'),
  seoMetaId: text('seo_meta_id').references(() => seoMeta.id),
}, (table) => ({
  serviceLocaleIdx: uniqueIndex('service_translations_idx').on(table.serviceId, table.locale),
}))

/* ═══════════════════════════════════════
   5. BLOG
   ═══════════════════════════════════════ */

export const blogCategories = sqliteTable('blog_categories', {
  id: id(),
  slugBase: text('slug_base').notNull().unique(),
  serviceId: text('service_id').references(() => services.id),
  sortOrder: integer('sort_order').notNull().default(0),
  status: text('status', { enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] }).notNull().default('PUBLISHED'),
})

export const blogCategoryTranslations = sqliteTable('blog_category_translations', {
  id: id(),
  categoryId: text('category_id').notNull().references(() => blogCategories.id, { onDelete: 'cascade' }),
  locale: text('locale', { enum: ['ru', 'uk'] }).notNull(),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  seoMetaId: text('seo_meta_id').references(() => seoMeta.id),
}, (table) => ({
  catLocaleIdx: uniqueIndex('blog_cat_translations_idx').on(table.categoryId, table.locale),
}))

export const blogPosts = sqliteTable('blog_posts', {
  id: id(),
  categoryId: text('category_id').references(() => blogCategories.id),
  authorId: text('author_id').references(() => users.id),
  status: text('status', { enum: ['DRAFT', 'REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'] }).notNull().default('DRAFT'),
  coverImageId: text('cover_image_id'),
  readingMinutes: integer('reading_minutes').notNull().default(5),
  publishedAt: integer('published_at', { mode: 'timestamp_ms' }),
  scheduledAt: integer('scheduled_at', { mode: 'timestamp_ms' }),
  createdAt: createdAtFixed(),
  updatedAt: updatedAt(),
})

export const blogPostTranslations = sqliteTable('blog_post_translations', {
  id: id(),
  postId: text('post_id').notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
  locale: text('locale', { enum: ['ru', 'uk'] }).notNull(),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  excerpt: text('excerpt'),
  contentJson: text('content_json'),   // TipTap JSON
  contentHtml: text('content_html'),    // Rendered HTML
  tableOfContentsJson: text('table_of_contents_json'),
  faqJson: text('faq_json'), // JSON array of {question, answer}
  seoMetaId: text('seo_meta_id').references(() => seoMeta.id),
}, (table) => ({
  postLocaleIdx: uniqueIndex('blog_post_translations_idx').on(table.postId, table.locale),
}))

/* ═══════════════════════════════════════
   6. MEDIA
   ═══════════════════════════════════════ */

export const mediaAssets = sqliteTable('media_assets', {
  id: id(),
  fileName: text('file_name').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  width: integer('width'),
  height: integer('height'),
  storageKey: text('storage_key').notNull().unique(), // R2 key: YYYY/MM/uuid.ext
  publicUrl: text('public_url').notNull(),
  altRu: text('alt_ru'),
  altUk: text('alt_uk'),
  titleRu: text('title_ru'),
  titleUk: text('title_uk'),
  captionRu: text('caption_ru'),
  captionUk: text('caption_uk'),
  uploadedById: text('uploaded_by_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: createdAtFixed(),
})

/* ═══════════════════════════════════════
   7. FAQ
   ═══════════════════════════════════════ */

export const faqItems = sqliteTable('faq_items', {
  id: id(),
  group: text('group', { enum: ['HOME', 'GENERAL', 'SERVICE', 'CONTACTS'] }).notNull().default('GENERAL'),
  serviceId: text('service_id').references(() => services.id),
  status: text('status', { enum: ['DRAFT', 'PUBLISHED'] }).notNull().default('PUBLISHED'),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const faqItemTranslations = sqliteTable('faq_item_translations', {
  id: id(),
  faqItemId: text('faq_item_id').notNull().references(() => faqItems.id, { onDelete: 'cascade' }),
  locale: text('locale', { enum: ['ru', 'uk'] }).notNull(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
}, (table) => ({
  faqLocaleIdx: uniqueIndex('faq_item_translations_idx').on(table.faqItemId, table.locale),
}))

/* ═══════════════════════════════════════
   8. TESTIMONIALS
   ═══════════════════════════════════════ */

export const testimonials = sqliteTable('testimonials', {
  id: id(),
  status: text('status', { enum: ['DRAFT', 'PUBLISHED', 'HIDDEN'] }).notNull().default('DRAFT'),
  clientName: text('client_name').notNull(),
  clientAge: integer('client_age'),
  avatarInitials: text('avatar_initials'),
  rating: integer('rating'), // 1-5
  source: text('source'),
  consentConfirmed: integer('consent_confirmed', { mode: 'boolean' }).notNull().default(false),
  publishedAt: integer('published_at', { mode: 'timestamp_ms' }),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: createdAtFixed(),
})

export const testimonialTranslations = sqliteTable('testimonial_translations', {
  id: id(),
  testimonialId: text('testimonial_id').notNull().references(() => testimonials.id, { onDelete: 'cascade' }),
  locale: text('locale', { enum: ['ru', 'uk'] }).notNull(),
  problem: text('problem'),
  result: text('result'),
  text: text('text').notNull(),
}, (table) => ({
  testimonialLocaleIdx: uniqueIndex('testimonial_translations_idx').on(table.testimonialId, table.locale),
}))

/* ═══════════════════════════════════════
   9. LEADS / CRM
   ═══════════════════════════════════════ */

export const contactLeads = sqliteTable('contact_leads', {
  id: id(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  message: text('message'),
  sourcePage: text('source_page'),
  locale: text('locale', { enum: ['ru', 'uk'] }),
  status: text('status', { enum: ['NEW', 'IN_PROGRESS', 'CONTACTED', 'BOOKED', 'CLOSED', 'SPAM'] }).notNull().default('NEW'),
  internalNote: text('internal_note'),
  ipHash: text('ip_hash'),
  userAgent: text('user_agent'),
  createdAt: createdAtFixed(),
  updatedAt: updatedAt(),
})

export const leadEvents = sqliteTable('lead_events', {
  id: id(),
  leadId: text('lead_id').notNull().references(() => contactLeads.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id),
  type: text('type', { enum: ['STATUS_CHANGE', 'NOTE', 'CONTACTED', 'BOOKED'] }).notNull(),
  note: text('note'),
  createdAt: createdAtFixed(),
})

/* ═══════════════════════════════════════
   10. SETTINGS & NAVIGATION
   ═══════════════════════════════════════ */

export const siteSettings = sqliteTable('site_settings', {
  key: text('key').primaryKey(),
  valueJson: text('value_json').notNull(), // JSON
  updatedById: text('updated_by_id').references(() => users.id),
  updatedAt: updatedAt(),
})

export const contactChannels = sqliteTable('contact_channels', {
  id: id(),
  type: text('type', { enum: ['TELEGRAM', 'WHATSAPP', 'EMAIL', 'PHONE', 'CUSTOM'] }).notNull(),
  label: text('label').notNull(),
  value: text('value').notNull(),
  url: text('url'),
  isPrimary: integer('is_primary', { mode: 'boolean' }).notNull().default(false),
  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const navigationItems = sqliteTable('navigation_items', {
  id: id(),
  location: text('location', { enum: ['HEADER', 'FOOTER', 'MOBILE'] }).notNull(),
  parentId: text('parent_id'),
  href: text('href').notNull(),
  labelRu: text('label_ru').notNull(),
  labelUk: text('label_uk').notNull(),
  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
})

/* ═══════════════════════════════════════
   11. REDIRECTS
   ═══════════════════════════════════════ */

export const redirectRules = sqliteTable('redirect_rules', {
  id: id(),
  fromPath: text('from_path').notNull().unique(),
  toPath: text('to_path').notNull(),
  statusCode: integer('status_code').notNull().default(301),
  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
  hitCount: integer('hit_count').notNull().default(0),
  createdAt: createdAtFixed(),
})

/* ═══════════════════════════════════════
   12. REVISIONS
   ═══════════════════════════════════════ */

export const contentRevisions = sqliteTable('content_revisions', {
  id: id(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  locale: text('locale', { enum: ['ru', 'uk'] }),
  dataJson: text('data_json').notNull(), // Full snapshot of the entity
  createdById: text('created_by_id').references(() => users.id),
  createdAt: createdAtFixed(),
  label: text('label'),
}, (table) => ({
  entityRevIdx: index('content_revisions_entity_idx').on(table.entityType, table.entityId),
}))

/* ═══════════════════════════════════════
   INFERRED TYPES
   ═══════════════════════════════════════ */

// ── Users ──
export type User = InferSelectModel<typeof users>
export type NewUser = InferInsertModel<typeof users>

// ── Audit ──
export type AuditLog = InferSelectModel<typeof auditLogs>
export type NewAuditLog = InferInsertModel<typeof auditLogs>

// ── SEO ──
export type SeoMeta = InferSelectModel<typeof seoMeta>
export type NewSeoMeta = InferInsertModel<typeof seoMeta>

// ── Pages ──
export type Page = InferSelectModel<typeof pages>
export type NewPage = InferInsertModel<typeof pages>
export type PageTranslation = InferSelectModel<typeof pageTranslations>
export type PageSection = InferSelectModel<typeof pageSections>
export type PageSectionTranslation = InferSelectModel<typeof pageSectionTranslations>

// ── Services ──
export type Service = InferSelectModel<typeof services>
export type NewService = InferInsertModel<typeof services>
export type ServiceTranslation = InferSelectModel<typeof serviceTranslations>

// ── Blog ──
export type BlogCategory = InferSelectModel<typeof blogCategories>
export type BlogCategoryTranslation = InferSelectModel<typeof blogCategoryTranslations>
export type BlogPost = InferSelectModel<typeof blogPosts>
export type NewBlogPost = InferInsertModel<typeof blogPosts>
export type BlogPostTranslation = InferSelectModel<typeof blogPostTranslations>

// ── Media ──
export type MediaAsset = InferSelectModel<typeof mediaAssets>

// ── FAQ ──
export type FaqItem = InferSelectModel<typeof faqItems>
export type FaqItemTranslation = InferSelectModel<typeof faqItemTranslations>

// ── Testimonials ──
export type Testimonial = InferSelectModel<typeof testimonials>
export type TestimonialTranslation = InferSelectModel<typeof testimonialTranslations>

// ── Leads ──
export type ContactLead = InferSelectModel<typeof contactLeads>
export type NewContactLead = InferInsertModel<typeof contactLeads>
export type LeadEvent = InferSelectModel<typeof leadEvents>

// ── Settings ──
export type SiteSetting = InferSelectModel<typeof siteSettings>
export type ContactChannel = InferSelectModel<typeof contactChannels>
export type NavigationItem = InferSelectModel<typeof navigationItems>

// ── Redirects ──
export type RedirectRule = InferSelectModel<typeof redirectRules>

// ── Revisions ──
export type ContentRevision = InferSelectModel<typeof contentRevisions>
