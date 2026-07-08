'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { createTestimonial, updateTestimonial } from '@/lib/actions/testimonials'

interface TestimonialItem {
  id: string
  status: string
  clientName: string | null
  clientAge: number | null
  avatarInitials: string | null
  rating: number | null
  source: string | null
  consentConfirmed: boolean
  sortOrder: number
}

interface TestimonialTranslation {
  id: string
  locale: string
  problem: string | null
  result: string | null
  text: string | null
}

interface Props {
  testimonial?: TestimonialItem & { translations: TestimonialTranslation[] }
}

export function TestimonialForm({ testimonial }: Props) {
  const isEdit = !!testimonial

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      try {
        if (isEdit) {
          await updateTestimonial(testimonial!.id, formData)
        } else {
          await createTestimonial(formData)
        }
        return null
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Unknown error' }
      }
    },
    null,
  )

  const tr = (locale: string, field: string): string => {
    if (!testimonial) return ''
    const t = testimonial.translations.find(t => t.locale === locale)
    if (!t) return ''
    return (t as unknown as Record<string, string | null>)[field] ?? ''
  }

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</div>}

      <fieldset className="rounded-lg border p-4">
        <legend className="text-sm font-semibold text-gray-700">Загальні поля</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">Ім&apos;я клієнта *</label>
            <input id="clientName" name="clientName" defaultValue={testimonial?.clientName ?? ''} required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Статус</label>
            <select id="status" name="status" defaultValue={testimonial?.status ?? 'DRAFT'}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="DRAFT">Чернетка</option>
              <option value="PUBLISHED">Опубліковано</option>
              <option value="HIDDEN">Приховано</option>
            </select>
          </div>
          <div>
            <label htmlFor="rating" className="block text-sm font-medium text-gray-700">Рейтинг (0-5)</label>
            <input id="rating" name="rating" type="number" min={0} max={5} defaultValue={testimonial?.rating ?? 0}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="clientAge" className="block text-sm font-medium text-gray-700">Вік</label>
            <input id="clientAge" name="clientAge" type="number" min={0} defaultValue={testimonial?.clientAge ?? ''}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="avatarInitials" className="block text-sm font-medium text-gray-700">Ініціали аватара</label>
            <input id="avatarInitials" name="avatarInitials" maxLength={10} defaultValue={testimonial?.avatarInitials ?? ''}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="source" className="block text-sm font-medium text-gray-700">Джерело</label>
            <input id="source" name="source" defaultValue={testimonial?.source ?? ''}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700">Порядок</label>
            <input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={testimonial?.sortOrder ?? 0}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input name="consentConfirmed" type="checkbox" defaultChecked={testimonial?.consentConfirmed ?? false}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
              Згода підтверджена
            </label>
          </div>
        </div>
      </fieldset>

      <LocaleSection locale="ru" label="RU" tr={tr} />
      <LocaleSection locale="uk" label="UK" tr={tr} />

      <div className="flex items-center gap-3 border-t pt-4">
        <button type="submit" disabled={pending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {pending ? 'Збереження...' : isEdit ? 'Зберегти зміни' : 'Створити відгук'}
        </button>
        <Link href="/admin/testimonials" className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">Скасувати</Link>
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
          <label htmlFor={`${locale}_text`} className="block text-sm font-medium text-gray-700">Текст відгуку *</label>
          <textarea id={`${locale}_text`} name={`${locale}_text`} rows={5} defaultValue={tr(locale, 'text')} required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor={`${locale}_problem`} className="block text-sm font-medium text-gray-700">Проблема</label>
            <textarea id={`${locale}_problem`} name={`${locale}_problem`} rows={3} defaultValue={tr(locale, 'problem')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor={`${locale}_result`} className="block text-sm font-medium text-gray-700">Результат</label>
            <textarea id={`${locale}_result`} name={`${locale}_result`} rows={3} defaultValue={tr(locale, 'result')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>
      </div>
    </fieldset>
  )
}
