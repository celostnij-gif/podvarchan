'use client'

import { useActionState, useState, useRef, useEffect } from 'react'
import { createPricingPlan, updatePricingPlan } from '@/lib/actions/pricing'
import Link from 'next/link'
import { useToast } from '@/components/admin'
import { useRouter } from 'next/navigation'
import type { PricingPlanWithTranslations } from './types'

interface Props {
  plan?: PricingPlanWithTranslations
}

const LOCALES = [
  { code: 'ru', label: 'RU' },
  { code: 'uk', label: 'UK' },
] as const

export function PricingForm({ plan }: Props) {
  const isEdit = !!plan
  const { showToast } = useToast()
  const router = useRouter()

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      try {
        if (isEdit) {
          await updatePricingPlan(plan!.id, formData)
        } else {
          await createPricingPlan(formData)
        }
        showToast('success', 'Збережено')
        return { saved: true, redirectTo: '/admin/pricing' }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Невідома помилка'
        showToast('error', msg)
        return { error: msg }
      }
    },
    null,
  )

  useEffect(() => {
    if (state?.saved) router.push(state.redirectTo!)
  }, [state?.saved, state?.redirectTo, router])

  const formRef = useRef<HTMLFormElement>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasUnsavedChanges])

  const tr = (locale: 'ru' | 'uk', field: 'title' | 'subtitle' | 'description' | 'badge' | 'featuresJson'): string => {
    if (!plan) return ''
    const t = plan.translations.find((tr) => tr.locale === locale)
    if (!t) return ''
    const val = (t as unknown as Record<string, unknown>)[field]
    return typeof val === 'string' ? val : ''
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onChange={() => setHasUnsavedChanges(true)}
      className="space-y-6"
    >
      {state?.error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {state.error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-zinc-300">Key (машинний)</span>
          <select
            name="key"
            defaultValue={plan?.key ?? 'free'}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          >
            <option value="free">free</option>
            <option value="single">single</option>
            <option value="premium">premium</option>
            <option value="elite">elite</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-zinc-300">Статус</span>
          <select
            name="status"
            defaultValue={plan?.status ?? 'PUBLISHED'}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          >
            <option value="PUBLISHED">Опублікований</option>
            <option value="DRAFT">Чернетка</option>
            <option value="ARCHIVED">Архів</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-zinc-300">Ціна, $</span>
          <input
            name="price"
            type="number"
            min={0}
            required
            defaultValue={plan?.price ?? 50}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-zinc-300">Стара ціна, $ (закреслена)</span>
          <input
            name="old_price"
            type="number"
            min={0}
            defaultValue={plan?.oldPrice != null ? plan.oldPrice : ''}
            placeholder="—"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-zinc-300">Сортування</span>
          <input
            name="sort_order"
            type="number"
            min={0}
            defaultValue={plan?.sortOrder ?? 0}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-zinc-300">Валюта</span>
          <input
            name="currency"
            defaultValue={plan?.currency ?? 'USD'}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </label>
      </div>

      {LOCALES.map(({ code, label }) => (
        <div key={code} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">{label}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-zinc-300">Назва *</span>
              <input
                name={`${code}_title`}
                required
                defaultValue={tr(code, 'title')}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-zinc-300">Підзаголовок</span>
              <input
                name={`${code}_subtitle`}
                defaultValue={tr(code, 'subtitle')}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-zinc-300">Опис (дрібний текст під ціною)</span>
              <input
                name={`${code}_description`}
                defaultValue={tr(code, 'description')}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-zinc-300">Бейдж (опційно)</span>
              <input
                name={`${code}_badge`}
                defaultValue={tr(code, 'badge')}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-zinc-300">Фічі (по одній в рядку)</span>
              <textarea
                name={`${code}_features`}
                rows={5}
                defaultValue={tr(code, 'featuresJson').replace(/"|\[|\]|\\/g, '')}
                placeholder={'Кожна фіча — з нового рядка'}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
              />
            </label>
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-amber-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {pending ? 'Збереження...' : 'Зберегти'}
        </button>
        <Link
          href="/admin/pricing"
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700"
        >
          Скасувати
        </Link>
      </div>
    </form>
  )
}
