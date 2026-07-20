'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { createFaq, updateFaq } from '@/lib/actions/faq'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { TipTapEditor } from '@/components/admin/editor/TipTapEditor'

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
        if (isRedirectError(err)) throw err
        return { error: err instanceof Error ? err.message : 'Невідома помилка' }
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

  const [ruAnswer, setRuAnswer] = useState(tr('ru', 'answer'))
  const [ukAnswer, setUkAnswer] = useState(tr('uk', 'answer'))

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && <div className="rounded-lg border border-red-900/50 bg-red-900/20 p-3 text-sm text-red-400">{state.error}</div>}

      <fieldset className="rounded-lg border p-4">
        <legend className="text-sm font-semibold text-zinc-300">Загальні поля</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label htmlFor="group" className="block text-sm font-medium text-zinc-300">Група</label>
            <select id="group" name="group" defaultValue={faq?.group ?? 'GENERAL'}
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30">
              <option value="HOME">Головна</option>
              <option value="GENERAL">Загальні</option>
              <option value="SERVICE">Послуги</option>
              <option value="CONTACTS">Контакти</option>
            </select>
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-zinc-300">Статус</label>
            <select id="status" name="status" defaultValue={faq?.status ?? 'DRAFT'}
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30">
              <option value="DRAFT">Чернетка</option>
              <option value="PUBLISHED">Опубліковано</option>
            </select>
          </div>
          <div>
            <label htmlFor="sortOrder" className="block text-sm font-medium text-zinc-300">Порядок</label>
            <input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={faq?.sortOrder ?? 0}
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
          </div>
          <div>
            <label htmlFor="serviceId" className="block text-sm font-medium text-zinc-300">ID послуги</label>
            <input id="serviceId" name="serviceId" defaultValue={faq?.serviceId ?? ''}
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-lg border border-zinc-700/50 p-4">
        <legend className="text-sm font-semibold text-amber-400">RU</legend>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label htmlFor="ru_question" className="block text-sm font-medium text-zinc-300">Питання *</label>
            <input id="ru_question" name="ru_question" defaultValue={tr('ru', 'question')} required
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300">Відповідь *</label>
            <input type="hidden" name="ru_answer" value={ruAnswer} />
            <TipTapEditor value={ruAnswer} onChange={(html) => setRuAnswer(html)} placeholder="Відповідь на питання..." />
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-lg border border-zinc-700/50 p-4">
        <legend className="text-sm font-semibold text-amber-400">UK</legend>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label htmlFor="uk_question" className="block text-sm font-medium text-zinc-300">Питання *</label>
            <input id="uk_question" name="uk_question" defaultValue={tr('uk', 'question')} required
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300">Відповідь *</label>
            <input type="hidden" name="uk_answer" value={ukAnswer} />
            <TipTapEditor value={ukAnswer} onChange={(html) => setUkAnswer(html)} placeholder="Відповідь на питання..." />
          </div>
        </div>
      </fieldset>

      <div className="flex items-center gap-3 border-t pt-4">
        <button type="submit" disabled={pending}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50">
          {pending ? 'Збереження...' : isEdit ? 'Зберегти зміни' : 'Створити FAQ'}
        </button>
        <Link href="/admin/faq" className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800">Скасувати</Link>
      </div>
    </form>
  )
}
