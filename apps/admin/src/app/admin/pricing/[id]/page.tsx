import { getDB } from '@/db'
import { pricingPlans, pricingPlanTranslations } from '@/db/schema/pricing'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { PricingForm } from '../pricing-form'
import type { PricingPlanWithTranslations } from '../types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditPricingPage(props: Props) {
  const { id } = await props.params
  const db = getDB()

  const rows = await db
    .select()
    .from(pricingPlans)
    .leftJoin(pricingPlanTranslations, eq(pricingPlans.id, pricingPlanTranslations.planId))
    .where(eq(pricingPlans.id, id))
    .all()

  if (rows.length === 0) notFound()

  const plan: PricingPlanWithTranslations = {
    ...rows[0].pricing_plans,
    translations: rows
      .map((r) => r.pricing_plan_translations)
      .filter((t): t is NonNullable<typeof t> => t !== null),
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">
          Редагувати план: <span className="font-mono text-amber-400">{plan.key}</span>
        </h1>
      </div>
      <PricingForm plan={plan} />
    </div>
  )
}
