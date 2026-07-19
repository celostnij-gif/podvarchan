'use client'

import { useActionState, useState, useRef } from 'react'
import Link from 'next/link'
import { createCategory, updateCategory } from '@/lib/actions/blog'
import type { CategoryWithTranslations } from '../types'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { slugify } from '@/lib/slugify'

interface Props {
  category?: CategoryWithTranslations
  services: { id: string; slugBase: string; ruTitle?: string }[]
}

export function CategoryForm({ category, services }: Props) {
  const isEdit = !!category

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      try {
        if (isEdit) {
          await updateCategory(category!.id, formData)
        } else {
          await createCategory(formData)
        }
        return null
      } catch (err) {
        if (isRedirectError(err)) throw err
        return { error: err instanceof Error ? err.message : 'Unknown error' }
      }
    },
    null,
  )

  const tr = (locale: string, field: string): string => {
    if (!category) return ''
    const t = category.translations?.find((tr) => tr.locale === locale)
    if (!t) return ''
    return (t as unknown as Record<string, string | null>)[field] ?? ''
  }

  // Auto-slug: derive slugBase + locale slugs from ruName
  const [ruName, setRuName] = useState(tr('ru', 'name'))
  const [slugBase, setSlugBase] = useState(category?.slugBase ?? '')
  const [ruSlug, setRuSlug] = useState(tr('ru', 'slug'))
  const [ukSlug, setUkSlug] = useState(tr('uk', 'slug'))
  const slugAutoRef = useRef(!isEdit)

  function handleRuNameChange(v: string) {
    setRuName(v)
    if (!slugAutoRef.current) return
    const s = slugify(v)
    setSlugBase(s)
    setRuSlug(s)
    if (!ukSlug) setUkSlug(s)
  }

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-lg border border-red-900/50 bg-red-900/20 p-3 text-sm text-red-400">{state.error}</div>
      )}

      {/* Hidden slugBase */}
      <input type="hidden" name="slugBase" value={slugBase} />
      <input type="hidden" name="ru_slug" value={ruSlug} />
      <input type="hidden" name="uk_slug" value={ukSlug} />

      <fieldset className="rounded-lg border border-zinc-700/50 p-4">
        <legend className="text-sm font-semibold text-zinc-300">Основні параметри</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-zinc-300">Статус</label>
            <select id="status" name="status" defaultValue={category?.status ?? 'PUBLISHED'}
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30">
              <option value="DRAFT">Чернетка</option>
              <option value="PUBLISHED">Опубліковано</option>
              <option value="ARCHIVED">Архів</option>
            </select>
          </div>
          <div>
            <label htmlFor="sortOrder" className="block text-sm font-medium text-zinc-300">Порядок у списку</label>
            <input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={category?.sortOrder ?? 0}
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
          </div>
          <div>
            <label htmlFor="serviceId" className="block text-sm font-medium text-zinc-300">Пов&apos;язана послуга</label>
            <select id="serviceId" name="serviceId" defaultValue={category?.serviceId ?? ''}
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30">
              <option value="">— Без послуги —</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.ruTitle ? s.ruTitle : s.slugBase}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Advanced slug override */}
        <details className="mt-4" open={isEdit}>
          <summary className="cursor-pointer select-none text-xs text-zinc-500 hover:text-zinc-300">
            {isEdit ? 'Slug (URL-ідентифікатор)' : 'Розширені налаштування slug (автоматичний)'}
          </summary>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Slug Base (внутрішній)</label>
              <input value={slugBase}
                onChange={(e) => { slugAutoRef.current = false; setSlugBase(e.target.value) }}
                className="w-full rounded border border-zinc-700 bg-zinc-900/50 px-2 py-1.5 text-xs font-mono text-zinc-200 focus:border-amber-500/50 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Slug RU</label>
              <input value={ruSlug}
                onChange={(e) => { slugAutoRef.current = false; setRuSlug(e.target.value) }}
                className="w-full rounded border border-zinc-700 bg-zinc-900/50 px-2 py-1.5 text-xs font-mono text-zinc-200 focus:border-amber-500/50 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Slug UK</label>
              <input value={ukSlug}
                onChange={(e) => { slugAutoRef.current = false; setUkSlug(e.target.value) }}
                className="w-full rounded border border-zinc-700 bg-zinc-900/50 px-2 py-1.5 text-xs font-mono text-zinc-200 focus:border-amber-500/50 focus:outline-none" />
            </div>
          </div>
        </details>
      </fieldset>

      {/* RU locale */}
      <fieldset className="rounded-lg border border-zinc-700/50 p-4">
        <legend className="text-sm font-semibold text-amber-400">🇷🇺 Російська</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="ru_name" className="block text-sm font-medium text-zinc-300">Назва категорії *</label>
            <input id="ru_name" name="ru_name"
              value={ruName}
              onChange={(e) => handleRuNameChange(e.target.value)}
              required
              placeholder="Наприклад: Тривога і стрес"
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
            {ruSlug && (
              <p className="mt-1 text-xs text-zinc-500">
                URL: <span className="font-mono text-zinc-400">/ru/blog/kategoriya/{ruSlug}/</span>
              </p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="ru_description" className="block text-sm font-medium text-zinc-300">Опис</label>
            <textarea id="ru_description" name="ru_description" rows={2} defaultValue={tr('ru', 'description')}
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
          </div>
        </div>
      </fieldset>

      {/* UK locale */}
      <fieldset className="rounded-lg border border-zinc-700/50 p-4">
        <legend className="text-sm font-semibold text-amber-400">🇺🇦 Українська</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="uk_name" className="block text-sm font-medium text-zinc-300">Назва категорії *</label>
            <input id="uk_name" name="uk_name" defaultValue={tr('uk', 'name')} required
              placeholder="Наприклад: Тривога і стрес (UK)"
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
            {ukSlug && (
              <p className="mt-1 text-xs text-zinc-500">
                URL: <span className="font-mono text-zinc-400">/uk/blog/kategoriya/{ukSlug}/</span>
              </p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="uk_description" className="block text-sm font-medium text-zinc-300">Опис</label>
            <textarea id="uk_description" name="uk_description" rows={2} defaultValue={tr('uk', 'description')}
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
          </div>
        </div>
      </fieldset>

      <div className="flex items-center gap-3 border-t border-zinc-800 pt-4">
        <button type="submit" disabled={pending}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
          {pending ? 'Збереження...' : isEdit ? 'Зберегти зміни' : 'Створити категорію'}
        </button>
        <Link href="/admin/blog/categories"
          className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800">
          Скасувати
        </Link>
      </div>
    </form>
  )
}
