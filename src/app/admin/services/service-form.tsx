'use client'

import { useActionState } from 'react'
import { createService, updateService } from '@/app/admin/actions/services'
import Link from 'next/link'
import type { ServiceWithTranslations } from './types'

interface Props {
  service?: ServiceWithTranslations
}

const CATEGORIES = [
  'gipnoterapiya',
  'trevoga',
  'podsoznanie',
  'samosabotazh',
  'vygoraniye',
  'neyverennost',
  'psikhosomatika',
  'krizis',
  'tsifrovoy-detoks',
  'zagalni-zapit',
]

export function ServiceForm({ service }: Props) {
  const isEdit = !!service

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      try {
        if (isEdit) {
          await updateService(service!.id, formData)
        } else {
          await createService(formData)
        }
        return null
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Unknown error' }
      }
    },
    null,
  )

  // Helper to read translation value
  const tr = (locale: string, field: string): string => {
    if (!service) return ''
    const t = service.translations?.find((tr) => tr.locale === locale)
    if (!t) return ''
    const val = (t as unknown as Record<string, unknown>)[field]
    return typeof val === 'string' ? val : ''
  }

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</div>
      )}

      {/* Common fields */}
      <fieldset className="rounded-lg border p-4">
        <legend className="text-sm font-semibold text-gray-700">Загальні поля</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="slugBase" className="block text-sm font-medium text-gray-700">
              Slug Base *
            </label>
            <input
              id="slugBase"
              name="slugBase"
              defaultValue={service?.slugBase ?? ''}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="icon" className="block text-sm font-medium text-gray-700">
              Іконка (emoji)
            </label>
            <input
              id="icon"
              name="icon"
              defaultValue={service?.icon ?? ''}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Категорія
            </label>
            <select
              id="category"
              name="category"
              defaultValue={service?.category ?? ''}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">—</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
              Пріоритет
            </label>
            <input
              id="priority"
              name="priority"
              type="number"
              min={0}
              defaultValue={service?.priority ?? 0}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700">
              Порядок сортування
            </label>
            <input
              id="sortOrder"
              name="sortOrder"
              type="number"
              min={0}
              defaultValue={service?.sortOrder ?? 0}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Статус
            </label>
            <select
              id="status"
              name="status"
              defaultValue={service?.status ?? 'DRAFT'}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="DRAFT">Чернетка</option>
              <option value="PUBLISHED">Опубліковано</option>
              <option value="ARCHIVED">Архів</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                name="featured"
                type="checkbox"
                defaultChecked={service?.featured ?? false}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              Рекомендований
            </label>
          </div>
        </div>
      </fieldset>

      <LocaleTab label="RU" locale="ru" _service={service} tr={tr} />
      <LocaleTab label="UK" locale="uk" _service={service} tr={tr} />

      <div className="flex items-center gap-3 border-t pt-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? 'Збереження...' : isEdit ? 'Зберегти зміни' : 'Створити послугу'}
        </button>
        <Link
          href="/admin/services"
          className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          Скасувати
        </Link>
      </div>
    </form>
  )
}

function LocaleTab({
  label,
  locale,
  _service,
  tr,
}: {
  label: string
  locale: string
  _service?: ServiceWithTranslations
  tr: (locale: string, field: string) => string
}) {
  const isActive = true

  return (
    <fieldset className={`rounded-lg border p-4 ${isActive ? 'border-blue-200' : ''}`}>
      <legend className={`text-sm font-semibold ${isActive ? 'text-blue-700' : 'text-gray-500'}`}>
        {label} — переклад
      </legend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${locale}_slug`} className="block text-sm font-medium text-gray-700">
            Slug *
          </label>
          <input
            id={`${locale}_slug`}
            name={`${locale}_slug`}
            defaultValue={tr(locale, 'slug')}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor={`${locale}_title`} className="block text-sm font-medium text-gray-700">
            Назва *
          </label>
          <input
            id={`${locale}_title`}
            name={`${locale}_title`}
            defaultValue={tr(locale, 'title')}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor={`${locale}_shortTitle`} className="block text-sm font-medium text-gray-700">
            Коротка назва
          </label>
          <input
            id={`${locale}_shortTitle`}
            name={`${locale}_shortTitle`}
            defaultValue={tr(locale, 'shortTitle')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor={`${locale}_ctaText`} className="block text-sm font-medium text-gray-700">
            CTA текст
          </label>
          <input
            id={`${locale}_ctaText`}
            name={`${locale}_ctaText`}
            defaultValue={tr(locale, 'ctaText')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${locale}_description`} className="block text-sm font-medium text-gray-700">
            Опис
          </label>
          <textarea
            id={`${locale}_description`}
            name={`${locale}_description`}
            rows={3}
            defaultValue={tr(locale, 'description')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor={`${locale}_heroTitle`} className="block text-sm font-medium text-gray-700">
            Hero заголовок
          </label>
          <input
            id={`${locale}_heroTitle`}
            name={`${locale}_heroTitle`}
            defaultValue={tr(locale, 'heroTitle')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor={`${locale}_heroSubtitle`} className="block text-sm font-medium text-gray-700">
            Hero підзаголовок
          </label>
          <input
            id={`${locale}_heroSubtitle`}
            name={`${locale}_heroSubtitle`}
            defaultValue={tr(locale, 'heroSubtitle')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${locale}_symptomsJson`} className="block text-sm font-medium text-gray-700">
            Симптоми (JSON)
          </label>
          <textarea
            id={`${locale}_symptomsJson`}
            name={`${locale}_symptomsJson`}
            rows={4}
            defaultValue={tr(locale, 'symptomsJson')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${locale}_processJson`} className="block text-sm font-medium text-gray-700">
            Процес (JSON)
          </label>
          <textarea
            id={`${locale}_processJson`}
            name={`${locale}_processJson`}
            rows={4}
            defaultValue={tr(locale, 'processJson')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${locale}_benefitsJson`} className="block text-sm font-medium text-gray-700">
            Переваги (JSON)
          </label>
          <textarea
            id={`${locale}_benefitsJson`}
            name={`${locale}_benefitsJson`}
            rows={4}
            defaultValue={tr(locale, 'benefitsJson')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${locale}_faqJson`} className="block text-sm font-medium text-gray-700">
            FAQ (JSON)
          </label>
          <textarea
            id={`${locale}_faqJson`}
            name={`${locale}_faqJson`}
            rows={4}
            defaultValue={tr(locale, 'faqJson')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
    </fieldset>
  )
}
