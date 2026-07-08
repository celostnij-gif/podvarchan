'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { createCategory, updateCategory } from '@/lib/actions/blog'
import type { CategoryWithTranslations } from '../types'

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

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</div>
      )}

      <fieldset className="rounded-lg border p-4">
        <legend className="text-sm font-semibold text-gray-700">Загальні поля</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="slugBase" className="block text-sm font-medium text-gray-700">Slug Base *</label>
            <input id="slugBase" name="slugBase" defaultValue={category?.slugBase ?? ''} required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Статус</label>
            <select id="status" name="status" defaultValue={category?.status ?? 'DRAFT'}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="DRAFT">Чернетка</option>
              <option value="PUBLISHED">Опубліковано</option>
              <option value="ARCHIVED">Архів</option>
            </select>
          </div>
          <div>
            <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700">Порядок</label>
            <input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={category?.sortOrder ?? 0}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700">Пов&apos;язана послуга</label>
            <select id="serviceId" name="serviceId" defaultValue={category?.serviceId ?? ''}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="">—</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.slugBase} {s.ruTitle ? `(${s.ruTitle})` : ''}</option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      <LocaleSection label="RU" locale="ru" tr={tr} category={category} />
      <LocaleSection label="UK" locale="uk" tr={tr} category={category} />

      <div className="flex items-center gap-3 border-t pt-4">
        <button type="submit" disabled={pending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
          {pending ? 'Збереження...' : isEdit ? 'Зберегти зміни' : 'Створити категорію'}
        </button>
        <Link href="/admin/blog/categories"
          className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">
          Скасувати
        </Link>
      </div>
    </form>
  )
}

function LocaleSection({ label, locale, tr }: {
  label: string
  locale: string
  tr: (locale: string, field: string) => string
  category?: CategoryWithTranslations
}) {
  return (
    <fieldset className="rounded-lg border border-blue-200 p-4">
      <legend className="text-sm font-semibold text-blue-700">{label} — переклад</legend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${locale}_slug`} className="block text-sm font-medium text-gray-700">Slug *</label>
          <input id={`${locale}_slug`} name={`${locale}_slug`} defaultValue={tr(locale, 'slug')} required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor={`${locale}_name`} className="block text-sm font-medium text-gray-700">Назва *</label>
          <input id={`${locale}_name`} name={`${locale}_name`} defaultValue={tr(locale, 'name')} required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${locale}_description`} className="block text-sm font-medium text-gray-700">Опис</label>
          <textarea id={`${locale}_description`} name={`${locale}_description`} rows={3} defaultValue={tr(locale, 'description')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
      </div>
    </fieldset>
  )
}
