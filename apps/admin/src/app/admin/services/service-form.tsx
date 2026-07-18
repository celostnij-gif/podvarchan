'use client'

import { useActionState, useState } from 'react'
import { createService, updateService } from '@/lib/actions/services'
import Link from 'next/link'
import type { ServiceWithTranslations } from './types'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { TipTapEditor } from '@/components/admin/editor/TipTapEditor'
import { StructuredListEditor } from '@/components/admin/StructuredListEditor'

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
        if (isRedirectError(err)) throw err
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
        <div className="rounded-lg border border-red-900/50 bg-red-900/20 p-3 text-sm text-red-400">{state.error}</div>
      )}

      {/* Common fields */}
      <fieldset className="rounded-lg border p-4">
        <legend className="text-sm font-semibold text-zinc-300">Загальні поля</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="slugBase" className="block text-sm font-medium text-zinc-300">
              Slug Base *
            </label>
            <input
              id="slugBase"
              name="slugBase"
              defaultValue={service?.slugBase ?? ''}
              required
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            />
          </div>
          <div>
            <label htmlFor="icon" className="block text-sm font-medium text-zinc-300">
              Іконка (emoji)
            </label>
            <input
              id="icon"
              name="icon"
              defaultValue={service?.icon ?? ''}
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-zinc-300">
              Категорія
            </label>
            <select
              id="category"
              name="category"
              defaultValue={service?.category ?? ''}
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
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
            <label htmlFor="priority" className="block text-sm font-medium text-zinc-300">
              Пріоритет
            </label>
            <input
              id="priority"
              name="priority"
              type="number"
              min={0}
              defaultValue={service?.priority ?? 0}
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            />
          </div>
          <div>
            <label htmlFor="sortOrder" className="block text-sm font-medium text-zinc-300">
              Порядок сортування
            </label>
            <input
              id="sortOrder"
              name="sortOrder"
              type="number"
              min={0}
              defaultValue={service?.sortOrder ?? 0}
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-zinc-300">
              Статус
            </label>
            <select
              id="status"
              name="status"
              defaultValue={service?.status ?? 'DRAFT'}
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
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
                className="rounded border-zinc-700 text-amber-500 shadow-sm focus:border-amber-500 focus:ring-amber-500"
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
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
          {pending ? 'Збереження...' : isEdit ? 'Зберегти зміни' : 'Створити послугу'}
        </button>
        <Link
          href="/admin/services"
          className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800">
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
  const [descriptionHtml, setDescriptionHtml] = useState(tr(locale, 'description'))
  const isActive = true

  return (
    <fieldset className={`rounded-lg border p-4 ${isActive ? 'border-zinc-700/50' : ''}`}>
      <legend className={`text-sm font-semibold ${isActive ? 'text-amber-400' : 'text-zinc-600'}`}>
        {label} — переклад
      </legend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${locale}_slug`} className="block text-sm font-medium text-zinc-300">
            Slug *
          </label>
          <input
            id={`${locale}_slug`}
            name={`${locale}_slug`}
            defaultValue={tr(locale, 'slug')}
            required
            className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>
        <div>
          <label htmlFor={`${locale}_title`} className="block text-sm font-medium text-zinc-300">
            Назва *
          </label>
          <input
            id={`${locale}_title`}
            name={`${locale}_title`}
            defaultValue={tr(locale, 'title')}
            required
            className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>
        <div>
          <label htmlFor={`${locale}_shortTitle`} className="block text-sm font-medium text-zinc-300">
            Коротка назва
          </label>
          <input
            id={`${locale}_shortTitle`}
            name={`${locale}_shortTitle`}
            defaultValue={tr(locale, 'shortTitle')}
            className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>
        <div>
          <label htmlFor={`${locale}_ctaText`} className="block text-sm font-medium text-zinc-300">
            CTA текст
          </label>
          <input
            id={`${locale}_ctaText`}
            name={`${locale}_ctaText`}
            defaultValue={tr(locale, 'ctaText')}
            className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${locale}_description`} className="block text-sm font-medium text-zinc-300">
            Опис
          </label>
          <input type="hidden" name={`${locale}_description`} value={descriptionHtml} />
          <TipTapEditor value={descriptionHtml} onChange={(html) => setDescriptionHtml(html)} placeholder="Опис послуги..." />
        </div>
        <div>
          <label htmlFor={`${locale}_heroTitle`} className="block text-sm font-medium text-zinc-300">
            Hero заголовок
          </label>
          <input
            id={`${locale}_heroTitle`}
            name={`${locale}_heroTitle`}
            defaultValue={tr(locale, 'heroTitle')}
            className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>
        <div>
          <label htmlFor={`${locale}_heroSubtitle`} className="block text-sm font-medium text-zinc-300">
            Hero підзаголовок
          </label>
          <input
            id={`${locale}_heroSubtitle`}
            name={`${locale}_heroSubtitle`}
            defaultValue={tr(locale, 'heroSubtitle')}
            className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>
        <div className="sm:col-span-2">
          <StructuredListEditor
            value={tr(locale, 'symptomsJson')}
            onChange={(v) => {
              const input = document.getElementById(`${locale}_symptomsJson_hidden`) as HTMLInputElement
              if (input) input.value = v
            }}
            fields={[
              { key: 'icon', label: 'Іконка (emoji)' },
              { key: 'title', label: 'Назва' },
              { key: 'desc', label: 'Опис' },
            ]}
            emptyItem={{ icon: '', title: '', desc: '' }}
            label="Симптоми"
          />
          <input type="hidden" id={`${locale}_symptomsJson_hidden`} name={`${locale}_symptomsJson`}
            defaultValue={tr(locale, 'symptomsJson')} />
        </div>
        <div className="sm:col-span-2">
          <StructuredListEditor
            value={tr(locale, 'faqJson')}
            onChange={(v) => {
              const input = document.getElementById(`${locale}_faqJson_hidden`) as HTMLInputElement
              if (input) input.value = v
            }}
            fields={[
              { key: 'question', label: 'Питання' },
              { key: 'answer', label: 'Відповідь', type: 'textarea' },
            ]}
            emptyItem={{ question: '', answer: '' }}
            label="FAQ"
          />
          <input type="hidden" id={`${locale}_faqJson_hidden`} name={`${locale}_faqJson`}
            defaultValue={tr(locale, 'faqJson')} />
        <details className="sm:col-span-2">
          <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300 select-none">Розширені JSON поля (процес, переваги)</summary>
          <div className="grid grid-cols-1 gap-4 mt-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Процес (JSON)</label>
              <textarea name={`${locale}_processJson`} rows={3} defaultValue={tr(locale, 'processJson')}
                className="w-full rounded border border-zinc-700 bg-zinc-900/50 px-2 py-1 text-xs font-mono text-zinc-200" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Переваги (JSON)</label>
              <textarea name={`${locale}_benefitsJson`} rows={3} defaultValue={tr(locale, 'benefitsJson')}
                className="w-full rounded border border-zinc-700 bg-zinc-900/50 px-2 py-1 text-xs font-mono text-zinc-200" />
            </div>
          </div>
        </details>
        </div>
      </div>
    </fieldset>
  )
}
