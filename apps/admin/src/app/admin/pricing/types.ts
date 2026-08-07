import type { pricingPlans, pricingPlanTranslations } from '@podvarchan/shared'

export type PricingPlanRow = typeof pricingPlans.$inferSelect
export type PricingTranslationRow = typeof pricingPlanTranslations.$inferSelect

export interface PricingPlanWithTranslations extends PricingPlanRow {
  translations: PricingTranslationRow[]
}
