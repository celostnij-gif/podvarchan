import { LLMS_FULL_PREFIX, LLMS_FULL_SUFFIX, buildPricingTable } from '@/lib/static/llms'
import { getPricingPlans } from '@/lib/db/public'

/**
 * GET /llms-full.txt — AI/GEO readiness (AGENTS.md §6). Route, not static asset.
 * Цены — из pricing_plans (D1) через единый геттер с JSON-LD и /tseny (план v3, Фаза 5);
 * при недоступности D1 — историческая таблица-фолбэк.
 */
export async function GET() {
  const plans = await getPricingPlans('ru').catch(() => null)
  const content = LLMS_FULL_PREFIX + buildPricingTable(plans) + LLMS_FULL_SUFFIX
  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
