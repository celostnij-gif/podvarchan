import { getDB } from '@/db'
import { pricingPlans, pricingPlanTranslations } from '@/db/schema/pricing'
import { eq } from 'drizzle-orm'
import Link from 'next/link'
import type { PricingPlanWithTranslations } from './types'

export default async function PricingListPage() {
  const db = getDB()
  const rows = await db
    .select()
    .from(pricingPlans)
    .leftJoin(pricingPlanTranslations, eq(pricingPlans.id, pricingPlanTranslations.planId))
    .orderBy(pricingPlans.sortOrder)
    .all()

  const grouped = new Map<string, PricingPlanWithTranslations>()
  for (const row of rows) {
    const existing = grouped.get(row.pricing_plans.id)
    if (existing) {
      if (row.pricing_plan_translations) existing.translations.push(row.pricing_plan_translations)
    } else {
      grouped.set(row.pricing_plans.id, {
        ...row.pricing_plans,
        translations: row.pricing_plan_translations ? [row.pricing_plan_translations] : [],
      })
    }
  }
  const plans = Array.from(grouped.values())

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-100">Ціни (/tseny)</h1>
        <Link
          href="/admin/pricing/new"
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          + Новий план
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900 text-left text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3">Key</th>
              <th className="px-4 py-3">Назва (RU)</th>
              <th className="px-4 py-3">Назва (UK)</th>
              <th className="px-4 py-3">Ціна</th>
              <th className="px-4 py-3">Стара</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => {
              const ru = plan.translations.find((t) => t.locale === 'ru')
              const uk = plan.translations.find((t) => t.locale === 'uk')
              return (
                <tr key={plan.id} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-800/30">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-400">{plan.key}</td>
                  <td className="px-4 py-3 text-zinc-200">{ru?.title ?? '—'}</td>
                  <td className="px-4 py-3 text-zinc-200">{uk?.title ?? '—'}</td>
                  <td className="px-4 py-3 text-zinc-100 font-medium">{plan.price}$</td>
                  <td className="px-4 py-3 text-zinc-500">{plan.oldPrice != null ? `${plan.oldPrice}$` : '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        plan.status === 'PUBLISHED'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : plan.status === 'DRAFT'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-zinc-700/40 text-zinc-400'
                      }`}
                    >
                      {plan.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/pricing/${plan.id}`}
                      className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700"
                    >
                      Редагувати
                    </Link>
                  </td>
                </tr>
              )
            })}
            {plans.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                  Планів поки немає
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-zinc-600">
        Ціни використовуються на /tseny (картки + JSON-LD) та в llms.txt. Після збереження кеш публічного
        сайту інвалідується автоматично.
      </p>
    </div>
  )
}
