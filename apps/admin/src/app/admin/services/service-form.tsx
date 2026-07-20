'use client'

import { useActionState, useState, useRef, type FormEvent } from 'react'
import { createService, updateService } from '@/lib/actions/services'
import Link from 'next/link'
import type { ServiceWithTranslations } from './types'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { TipTapEditor } from '@/components/admin/editor/TipTapEditor'
import { StructuredListEditor } from '@/components/admin/StructuredListEditor'
import { slugify } from '@/lib/slugify'

interface Props {
  service?: ServiceWithTranslations
}

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '— Без категорії —' },
  { value: 'gipnoterapiya', label: 'Гіпнотерапія' },
  { value: 'trevoga', label: 'Тривога' },
  { value: 'podsoznanie', label: 'Підсвідомість' },
  { value: 'samosabotazh', label: 'Самосаботаж' },
  { value: 'vygoraniye', label: 'Вигорання' },
  { value: 'neyverennost', label: 'Невпевненість' },
  { value: 'psikhosomatika', label: 'Психосоматика' },
  { value: 'krizis', label: 'Криза' },
  { value: 'tsifrovoy-detoks', label: 'Цифровий детокс' },
  { value: 'zagalni-zapit', label: 'Загальний запит' },
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
        return { error: err instanceof Error ? err.message : 'Невідома помилка' }
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

  // Auto-slug state: derive slugBase and locale slugs from ruTitle on create
  const [ruTitle, setRuTitle] = useState(tr('ru', 'title'))
  const [slugBase, setSlugBase] = useState(service?.slugBase ?? '')
  const [ruSlug, setRuSlug] = useState(tr('ru', 'slug'))
  const [ukSlug, setUkSlug] = useState(tr('uk', 'slug'))
  const slugAutoRef = useRef(!isEdit) // only auto-derive on create
  const statusRef = useRef<HTMLSelectElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function handlePublish(e: FormEvent, status: string) {
    e.preventDefault()
    if (statusRef.current) statusRef.current.value = status
    formRef.current?.requestSubmit()
  }

  function handleRuTitleChange(v: string) {
    setRuTitle(v)
    if (!slugAutoRef.current) return
    const s = slugify(v)
    setSlugBase(s)
    setRuSlug(s)
    if (!ukSlug) setUkSlug(s)
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-lg border border-red-900/50 bg-red-900/20 p-3 text-sm text-red-400">{state.error}</div>
      )}

      {/* Hidden slugBase — managed by state */}
      <input type="hidden" name="slugBase" value={slugBase} />
      {/* Hidden status — controlled by CTA buttons */}
      <select ref={statusRef} name="status" defaultValue={service?.status ?? 'DRAFT'} className="hidden">
        <option value="DRAFT">Чернетка</option>
        <option value="PUBLISHED">Опубліковано</option>
        <option value="ARCHIVED">Архів</option>
      </select>

      {/* Common fields */}
      <fieldset className="rounded-lg border border-zinc-700/50 p-4">
        <legend className="text-sm font-semibold text-zinc-300">Основні параметри</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="icon" className="block text-sm font-medium text-zinc-300">
              Іконка (emoji)
            </label>
            <input
              id="icon"
              name="icon"
              defaultValue={service?.icon ?? ''}
              placeholder="🧠"
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
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
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
              Порядок у списку
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
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 cursor-pointer">
              <input
                name="featured"
                type="checkbox"
                defaultChecked={service?.featured ?? false}
                className="rounded border-zinc-700 text-amber-500 shadow-sm focus:border-amber-500 focus:ring-amber-500"
              />
              Рекомендована послуга
            </label>
          </div>
        </div>

        {/* Advanced: show slug fields for edit or as override */}
        <details className="mt-4" open={isEdit}>
          <summary className="cursor-pointer select-none text-xs text-zinc-500 hover:text-zinc-300">
            {isEdit ? 'Slug (URL-ідентифікатор)' : 'Розширені налаштування slug (автоматичний)'}
          </summary>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Slug Base (внутрішній)</label>
              <input
                value={slugBase}
                onChange={(e) => { slugAutoRef.current = false; setSlugBase(e.target.value) }}
                className="w-full rounded border border-zinc-700 bg-zinc-900/50 px-2 py-1.5 text-xs font-mono text-zinc-200 focus:border-amber-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Slug RU</label>
              <input
                value={ruSlug}
                onChange={(e) => { slugAutoRef.current = false; setRuSlug(e.target.value) }}
                className="w-full rounded border border-zinc-700 bg-zinc-900/50 px-2 py-1.5 text-xs font-mono text-zinc-200 focus:border-amber-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Slug UK</label>
              <input
                value={ukSlug}
                onChange={(e) => { slugAutoRef.current = false; setUkSlug(e.target.value) }}
                className="w-full rounded border border-zinc-700 bg-zinc-900/50 px-2 py-1.5 text-xs font-mono text-zinc-200 focus:border-amber-500/50 focus:outline-none"
              />
            </div>
          </div>
        </details>
      </fieldset>

      <LocaleTab
        label="🇷🇺 Російська"
        locale="ru"
        tr={tr}
        titleValue={ruTitle}
        slugValue={ruSlug}
        onTitleChange={handleRuTitleChange}
      />
      <LocaleTab
        label="🇺🇦 Українська"
        locale="uk"
        tr={tr}
        titleValue={tr('uk', 'title')}
        slugValue={ukSlug}
        onTitleChange={() => {}}
      />

      <div className="flex items-center gap-3 border-t border-zinc-800 pt-4">
        <button
          type="button"
          disabled={pending}
          onClick={(e) => handlePublish(e, 'DRAFT')}
          className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
          {pending ? 'Збереження...' : 'Зберегти чернетку'}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={(e) => handlePublish(e, 'PUBLISHED')}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
          {pending ? 'Публікація...' : 'Опублікувати'}
        </button>
        <Link
          href="/admin/services"
          className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800">
          Скасувати
        </Link>
      </div>

      {/* Advanced: manual status override */}
      {isEdit && (
        <details className="text-xs text-zinc-500">
          <summary className="cursor-pointer select-none hover:text-zinc-300">
            Ручне налаштування статусу
          </summary>
          <div className="mt-2">
            <label htmlFor="status-override" className="block text-xs font-medium text-zinc-400 mb-1">Статус</label>
            <select
              id="status-override"
              onChange={(e) => { if (statusRef.current) statusRef.current.value = e.target.value }}
              defaultValue={service?.status ?? 'DRAFT'}
              className="block w-48 rounded border border-zinc-700 bg-zinc-900/50 px-2 py-1.5 text-xs text-zinc-200 focus:border-amber-500/50 focus:outline-none"
            >
              <option value="DRAFT">Чернетка</option>
              <option value="PUBLISHED">Опубліковано</option>
              <option value="ARCHIVED">Архів</option>
            </select>
          </div>
        </details>
      )}
    </form>
  )
}

function LocaleTab({
  label,
  locale,
  tr,
  titleValue,
  slugValue,
  onTitleChange,
}: {
  label: string
  locale: string
  tr: (locale: string, field: string) => string
  titleValue: string
  slugValue: string
  onTitleChange: (v: string) => void
}) {
  const [descriptionHtml, setDescriptionHtml] = useState(tr(locale, 'description'))

  // Structured list states
  const [symptomsJson, setSymptomsJson] = useState(tr(locale, 'symptomsJson'))
  const [processJson, setProcessJson] = useState(tr(locale, 'processJson'))
  const [benefitsJson, setBenefitsJson] = useState(tr(locale, 'benefitsJson'))
  const [faqJson, setFaqJson] = useState(tr(locale, 'faqJson'))

  return (
    <fieldset className="rounded-lg border border-zinc-700/50 p-4">
      <legend className="text-sm font-semibold text-amber-400">{label}</legend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        {/* Hidden slug — controlled by parent */}
        <input type="hidden" name={`${locale}_slug`} value={slugValue} />

        <div className="sm:col-span-2">
          <label htmlFor={`${locale}_title`} className="block text-sm font-medium text-zinc-300">
            Назва послуги *
          </label>
          <input
            id={`${locale}_title`}
            name={`${locale}_title`}
            defaultValue={titleValue}
            onChange={(e) => locale === 'ru' && onTitleChange(e.target.value)}
            required
            placeholder={locale === 'ru' ? 'Наприклад: Гіпнотерапія' : 'Наприклад: Гіпнотерапія (UK)'}
            className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
          {locale === 'ru' && slugValue && (
            <p className="mt-1 text-xs text-zinc-500">
              URL: <span className="font-mono text-zinc-400">/{locale}/uslugi/{slugValue}/</span>
            </p>
          )}
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
            Текст кнопки CTA
          </label>
          <input
            id={`${locale}_ctaText`}
            name={`${locale}_ctaText`}
            defaultValue={tr(locale, 'ctaText')}
            placeholder="Записатися на консультацію"
            className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>

        <div>
          <label htmlFor={`${locale}_heroTitle`} className="block text-sm font-medium text-zinc-300">
            Заголовок hero-секції
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
            Підзаголовок hero-секції
          </label>
          <input
            id={`${locale}_heroSubtitle`}
            name={`${locale}_heroSubtitle`}
            defaultValue={tr(locale, 'heroSubtitle')}
            className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-zinc-300 mb-1">Опис послуги</label>
          <input type="hidden" name={`${locale}_description`} value={descriptionHtml} />
          <TipTapEditor value={descriptionHtml} onChange={(html) => setDescriptionHtml(html)} placeholder="Детальний опис послуги..." />
        </div>

        {/* Symptoms — visual list */}
        <div className="sm:col-span-2">
          <input type="hidden" name={`${locale}_symptomsJson`} value={symptomsJson} />
          <StructuredListEditor
            value={symptomsJson}
            onChange={setSymptomsJson}
            fields={[
              { key: 'icon', label: 'Іконка (emoji)' },
              { key: 'title', label: 'Симптом' },
              { key: 'desc', label: 'Пояснення' },
            ]}
            emptyItem={{ icon: '', title: '', desc: '' }}
            label="Симптоми / показання"
          />
        </div>

        {/* Process — visual list */}
        <div className="sm:col-span-2">
          <input type="hidden" name={`${locale}_processJson`} value={processJson} />
          <StructuredListEditor
            value={processJson}
            onChange={setProcessJson}
            fields={[
              { key: 'step', label: 'Крок (номер або назва)' },
              { key: 'title', label: 'Заголовок' },
              { key: 'desc', label: 'Опис', type: 'textarea' },
            ]}
            emptyItem={{ step: '', title: '', desc: '' }}
            label="Процес роботи"
          />
        </div>

        {/* Benefits — visual list */}
        <div className="sm:col-span-2">
          <input type="hidden" name={`${locale}_benefitsJson`} value={benefitsJson} />
          <StructuredListEditor
            value={benefitsJson}
            onChange={setBenefitsJson}
            fields={[
              { key: 'icon', label: 'Іконка (emoji)' },
              { key: 'title', label: 'Перевага' },
              { key: 'desc', label: 'Деталі' },
            ]}
            emptyItem={{ icon: '', title: '', desc: '' }}
            label="Переваги"
          />
        </div>

        {/* FAQ — visual list */}
        <div className="sm:col-span-2">
          <input type="hidden" name={`${locale}_faqJson`} value={faqJson} />
          <StructuredListEditor
            value={faqJson}
            onChange={setFaqJson}
            fields={[
              { key: 'question', label: 'Питання' },
              { key: 'answer', label: 'Відповідь', type: 'textarea' },
            ]}
            emptyItem={{ question: '', answer: '' }}
            label="FAQ послуги"
          />
        </div>

      </div>
    </fieldset>
  )
}
