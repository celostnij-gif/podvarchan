import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

/**
 * Прайс-планы (/tseny). Цены в долларах США (целые), старые цены — для
 * перечёркнутой вилки. Тексты — в pricing_plan_translations (ru/uk).
 * Единый источник цен для UI /tseny/, JSON-LD (priceRange/Offer) и llms.txt.
 */
export const pricingPlans = sqliteTable('pricing_plans', {
  id: text('id').primaryKey(),
  /** Стабильный машинный ключ: 'free' | 'single' | 'premium' | 'elite' */
  key: text('key').notNull().unique(),
  /** Цена, USD */
  price: integer('price').notNull(),
  /** Старая цена (зачёркнутая), USD — для акций */
  oldPrice: integer('old_price'),
  currency: text('currency').notNull().default('USD'),
  sortOrder: integer('sort_order').notNull().default(0),
  status: text('status', { enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] }).notNull().default('PUBLISHED'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const pricingPlanTranslations = sqliteTable('pricing_plan_translations', {
  id: text('id').primaryKey(),
  planId: text('plan_id')
    .notNull()
    .references(() => pricingPlans.id, { onDelete: 'cascade' }),
  locale: text('locale', { enum: ['ru', 'uk'] }).notNull(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  description: text('description'),
  /** Бейдж карточки («Выбор большинства») */
  badge: text('badge'),
  /** Доп. строка цены («или 2000 грн») */
  note: text('note'),
  /** JSON-массив фич карточки */
  featuresJson: text('features_json'),
}, (table) => ({
  planLocaleIdx: index('idx_pricing_plan_loc').on(table.planId, table.locale),
}))
