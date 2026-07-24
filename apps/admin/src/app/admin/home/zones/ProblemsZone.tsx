'use client'

import { useActionState, useState } from 'react'
import { updateHomeZone } from '@/lib/actions/home'
import { LocaleTabs } from '../components/LocaleTabs'
import type { ProblemsContent } from '@/lib/home/blueprint'

interface ProblemsZoneProps {
  data: { ru: ProblemsContent; uk: ProblemsContent }
}

export function ProblemsZone({ data }: ProblemsZoneProps) {
  const [locale, setLocale] = useState<'ru' | 'uk'>('ru')
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; saved?: boolean } | null, formData: FormData) => {
      const items = []
      for (let i = 0; i < 6; i++) {
        const icon = formData.get(`item${i}_icon`) as string
        const title = formData.get(`item${i}_title`) as string
        const subtitle = formData.get(`item${i}_subtitle`) as string
        if (title) items.push({ icon: icon ?? '', title, subtitle: subtitle ?? '' })
      }
      const content: ProblemsContent = {
        heading: (formData.get('heading') as string) ?? '',
        headingAccent: (formData.get('headingAccent') as string) ?? '',
        items,
        calloutTitle: (formData.get('calloutTitle') as string) ?? '',
        calloutAccent: (formData.get('calloutAccent') as string) ?? '',
        calloutText: (formData.get('calloutText') as string) ?? '',
        cta: (formData.get('cta') as string) ?? '',
      }
      const result = await updateHomeZone({ zone: 'problems', locale, content })
      if (result.ok) return { saved: true }
      return { error: 'Помилка збереження' }
    },
    null,
  )

  const current = locale === 'ru' ? data.ru : data.uk

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-100">Проблеми</h3>
        <p className="text-sm text-zinc-500 mt-1">Блок «Що привело вас сюда» — заголовок, картки проблем, callout</p>
      </div>

      <LocaleTabs active={locale} onChange={setLocale} />

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Заголовок</label>
            <input name="heading" defaultValue={current.heading} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Акцент заголовка</label>
            <input name="headingAccent" defaultValue={current.headingAccent} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none" />
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-medium text-zinc-400">Картки проблем (до 6)</label>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="grid grid-cols-[40px_1fr_1fr] gap-2">
              <input name={`item${i}_icon`} defaultValue={current.items?.[i]?.icon ?? ''} placeholder="😰" className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-2 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none" />
              <input name={`item${i}_title`} defaultValue={current.items?.[i]?.title ?? ''} placeholder={`Проблема ${i + 1}`} className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none" />
              <input name={`item${i}_subtitle`} defaultValue={current.items?.[i]?.subtitle ?? ''} placeholder="Опис" className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none" />
            </div>
          ))}
        </div>

        <div className="border-t border-zinc-700/50 pt-4 space-y-3">
          <label className="block text-xs font-medium text-zinc-400">Callout</label>
          <div className="grid grid-cols-2 gap-3">
            <input name="calloutTitle" defaultValue={current.calloutTitle} placeholder="Заголовок callout" className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none" />
            <input name="calloutAccent" defaultValue={current.calloutAccent} placeholder="Акцент" className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none" />
          </div>
          <textarea name="calloutText" defaultValue={current.calloutText} rows={2} placeholder="Текст callout" className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none" />
          <input name="cta" defaultValue={current.cta} placeholder="Текст CTA кнопки" className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none" />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={pending} className="px-4 py-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-sm font-medium hover:bg-amber-500/20 disabled:opacity-50">
            {pending ? 'Збереження...' : 'Зберегти'}
          </button>
          {state?.saved && <span className="text-xs text-green-400">Збережено</span>}
          {state?.error && <span className="text-xs text-red-400">{state.error}</span>}
        </div>
      </form>
    </div>
  )
}
