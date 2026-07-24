'use client'

import { useActionState, useState, useTransition } from 'react'
import { updateHomeMeta, ensureHomeBlueprint } from '@/lib/actions/home'
import { LocaleTabs } from '../components/LocaleTabs'

interface MetaZoneProps {
  pageStatus: string
  seo: {
    ru: { title: string | null; description: string | null; keywords: string | null } | null
    uk: { title: string | null; description: string | null; keywords: string | null } | null
  }
}

function SeedBlueprintButton() {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok?: boolean; created?: number; error?: string } | null>(null)

  const handleSeed = () => {
    startTransition(async () => {
      try {
        const res = await ensureHomeBlueprint()
        setResult({ ok: true, created: res.created })
      } catch (e) {
        setResult({ error: e instanceof Error ? e.message : 'Помилка' })
      }
    })
  }

  return (
    <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/40 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-zinc-200">Blueprint Seed</h4>
          <p className="text-xs text-zinc-500 mt-1">Створити відсутні секції та seo_meta в D1 (безпечний re-run)</p>
        </div>
        <button
          onClick={handleSeed}
          disabled={pending}
          className="px-3 py-1.5 rounded-lg bg-zinc-700/50 text-zinc-300 border border-zinc-600/50 text-xs font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          {pending ? 'Створення...' : 'Seed'}
        </button>
      </div>
      {result?.ok && (
        <p className="text-xs text-green-400 mt-2">Створено {result.created} елементів</p>
      )}
      {result?.error && (
        <p className="text-xs text-red-400 mt-2">{result.error}</p>
      )}
    </div>
  )
}

export function MetaZone({ pageStatus, seo }: MetaZoneProps) {
  const [locale, setLocale] = useState<'ru' | 'uk'>('ru')
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; saved?: boolean } | null, formData: FormData) => {
      const result = await updateHomeMeta({
        locale,
        title: (formData.get('seo_title') as string) || undefined,
        description: (formData.get('seo_description') as string) || undefined,
        keywords: (formData.get('seo_keywords') as string) || undefined,
      })
      if (result.ok) return { saved: true }
      return { error: 'Помилка збереження' }
    },
    null,
  )

  const currentSeo = locale === 'ru' ? seo.ru : seo.uk

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-100">Параметри та SEO</h3>
        <p className="text-sm text-zinc-500 mt-1">Статус сторінки та метадані для пошукових систем</p>
      </div>

      {/* Status */}
      <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/40 p-4">
        <label className="block text-sm font-medium text-zinc-300 mb-2">Статус</label>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full ${
            pageStatus === 'PUBLISHED'
              ? 'bg-green-900/30 text-green-400 border border-green-700/30'
              : 'bg-zinc-800/60 text-zinc-400 border border-zinc-700/50'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${pageStatus === 'PUBLISHED' ? 'bg-green-400' : 'bg-zinc-400'}`} />
            {pageStatus === 'PUBLISHED' ? 'Опубліковано' : 'Чернетка'}
          </span>
          <span className="text-xs text-zinc-500">Зміна статусу — через загальний редактор сторінок</span>
        </div>
      </div>

      {/* SEO per locale */}
      <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/40 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-zinc-200">SEO-мета</h4>
          <LocaleTabs active={locale} onChange={setLocale} />
        </div>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="locale" value={locale} />

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Meta Title
              <span className="text-zinc-600 ml-1">({(currentSeo?.title ?? '').length}/60)</span>
            </label>
            <input
              name="seo_title"
              defaultValue={currentSeo?.title ?? ''}
              maxLength={60}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
              placeholder="Психолог по тревоге онлайн | Подварчан"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Meta Description
              <span className="text-zinc-600 ml-1">({(currentSeo?.description ?? '').length}/160)</span>
            </label>
            <textarea
              name="seo_description"
              defaultValue={currentSeo?.description ?? ''}
              rows={3}
              maxLength={160}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
              placeholder="Эриксоновский гипноз при тревоге — мягко и с проработкой первопричины."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Keywords</label>
            <input
              name="seo_keywords"
              defaultValue={currentSeo?.keywords ?? ''}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
              placeholder="гипнотерапия онлайн, тревога, панические атаки"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-sm font-medium hover:bg-amber-500/20 transition-colors disabled:opacity-50"
            >
              {pending ? 'Збереження...' : 'Зберегти SEO'}
            </button>
            {state?.saved && <span className="text-xs text-green-400">Збережено</span>}
            {state?.error && <span className="text-xs text-red-400">{state.error}</span>}
          </div>
        </form>
      </div>

      {/* Blueprint seed — one-shot */}
      <SeedBlueprintButton />
    </div>
  )
}
