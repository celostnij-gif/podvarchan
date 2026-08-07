import { describe, it, expect } from 'vitest'
import { mapPricingRow } from '@/lib/db/public'

function makeRow(overrides: { price?: number; oldPrice?: number | null; featuresJson?: string | null } = {}) {
  return {
    pricing_plans: {
      id: 'plan-free',
      key: 'free',
      price: overrides.price ?? 0,
      oldPrice: overrides.oldPrice ?? null,
      currency: 'USD',
      sortOrder: 0,
      status: 'PUBLISHED' as const,
      createdAt: '2026-08-07T00:00:00.000Z',
      updatedAt: '2026-08-07T00:00:00.000Z',
    },
    pricing_plan_translations: {
      id: 'plan-free-ru',
      planId: 'plan-free',
      locale: 'ru' as const,
      title: 'Диагностическая консультация',
      subtitle: '15 минут · Знакомство и анализ запроса',
      description: 'Первичная онлайн-встреча для знакомства',
      badge: null,
      note: null,
      featuresJson: overrides.featuresJson ?? null,
    },
  }
}

describe('mapPricingRow (D1 pricing_plans → public card)', () => {
  it('maps all scalar fields and empty features when featuresJson is null', () => {
    const row = makeRow()
    const plan = mapPricingRow(row)
    expect(plan).toMatchObject({
      id: 'plan-free',
      key: 'free',
      price: 0,
      oldPrice: null,
      currency: 'USD',
      title: 'Диагностическая консультация',
      subtitle: '15 минут · Знакомство и анализ запроса',
      description: 'Первичная онлайн-встреча для знакомства',
      badge: null,
      note: null,
    })
    expect(plan.features).toEqual([])
  })

  it('parses featuresJson into a string array, dropping non-strings', () => {
    const row = makeRow({ price: 210, oldPrice: 250, featuresJson: '["5 сессий","Экономия 16%",42,null]' })
    const plan = mapPricingRow(row)
    expect(plan.price).toBe(210)
    expect(plan.oldPrice).toBe(250)
    expect(plan.features).toEqual(['5 сессий', 'Экономия 16%'])
  })

  it('returns empty features for malformed JSON instead of throwing', () => {
    const plan = mapPricingRow(makeRow({ featuresJson: '{broken' }))
    expect(plan.features).toEqual([])
    expect(plan.title).toBe('Диагностическая консультация')
  })
})
