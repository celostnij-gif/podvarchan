'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { createFaq, updateFaq } from '@/app/admin/actions/faq'

interface FaqItem {
  id: string
  group: string
  serviceId: string | null
  status: string
  sortOrder: number
}

interface FaqTranslation {
  id: string
  faqItemId: string
  locale: string
  question: string | null
  answer: string | null
}

interface Props {
  faq?: FaqItem & { translations: FaqTranslation[] }
}

export function FaqForm({ faq }: Props) {
  const isEdit = !!faq

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      try {
        if (isEdit) {
          await updateFaq(faq!.id, formData)
        } else {
          await createFaq(formData)
        }
        return null
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Unknown error' }
      }
    },
    null,
  )

  const tr = (locale: string, field: string): string => {
    if (!faq) return ''
    const t = faq.translations.find(t => t.locale === locale)
    if (!t) return ''
    return (t as unknown as Record<string, string | null>)[field] ?? ''
  }

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</div>}

      <fieldset className="rounded-lg border p-4">
        <legend className="text-sm font-semibold text-gray-700">Загальні поля</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label htmlFor="group" className="block text-sm font-medium text-gray-700">Група</label>
            <select id="group" name="group" defaultValue={faq?.group ?? 'GENERAL'}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="HOME">Головна</option>
              <option value="GENERAL">Загальні</option>
              <option value="SERVICE">Послуги</option>
              <option value="CONTACTS">Контакти</option>
            </select>
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Статус</label>
            <select id="status" name="status" defaultValue={faq?.status ?? 'DRAFT'}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="DRAFT">Чернетка</option>
              <option value="PUBLISHED">Опубліковано</option>
            </select>
          </div>
          <div>
            <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700">Порядок</label>
            <input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={faq?.sortOrder ?? 0}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700">ID послуги</label>
            <input id="serviceId" name="serviceId" defaultValue={faq?.serviceId ?? ''}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>
      </fieldset>

      <LocaleSection locale="ru" label="RU" tr={tr} />
      <LocaleSection locale="uk" label="UK" tr={tr} />

      <div className="flex items-center gap-3 border-t pt-4">
        <button type="submit" disabled={pending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {pending ? 'Збереження...' : isEdit ? 'Зберегти зміни' : 'Створити FAQ'}
        </button>
        <Link href="/admin/faq" className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">Скасувати</Link>
      </div>
    </form>
  )
}

function LocaleSection({ locale, label, tr }: { locale: string; label: string; tr: (l: string, f: string) => string }) {
  return (
    <fieldset className="rounded-lg border border-blue-200 p-4">
      <legend className="text-sm font-semibold text-blue-700">{label}</legend>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label htmlFor={`${locale}_question`} className="block text-sm font-medium text-gray-700">Питання *</label>
          <input id={`${locale}_question`} name={`${locale}_question`} defaultValue={tr(locale, 'question')} required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor={`${locale}_answer`} className="block text-sm font-medium text-gray-700">Відповідь *</label>
          <textarea id={`${locale}_answer`} name={`${locale}_answer`} rows={5} defaultValue={tr(locale, 'answer')} required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
      </div>
    </fieldset>
  )
}
