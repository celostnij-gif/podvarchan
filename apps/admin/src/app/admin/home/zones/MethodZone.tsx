'use client'

import { useActionState, useState } from 'react'
import { updateHomeZone } from '@/lib/actions/home'
import { LocaleTabs } from '../components/LocaleTabs'
import type { MethodContent } from '@/lib/home/blueprint'

interface MethodZoneProps {
  data: { ru: MethodContent; uk: MethodContent }
}

export function MethodZone({ data }: MethodZoneProps) {
  const [locale, setLocale] = useState<'ru' | 'uk'>('ru')
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; saved?: boolean } | null, formData: FormData) => {
      const items = []
      for (let i = 0; i < 4; i++) {
        const title = formData.get(`item${i}_title`) as string
        const description = formData.get(`item${i}_description`) as string
        const duration = formData.get(`item${i}_duration`) as string
        if (title) items.push({ title, description: description ?? '', duration: duration ?? '' })
      }
      const content: MethodContent = {
        heading: (formData.get('heading') as string) ?? '',
        subtitle: (formData.get('subtitle') as string) ?? '',
        items,
      }
      const result = await updateHomeZone({ zone: 'method', locale, content })
      if (result.ok) return { saved: true }
      return { error: 'Помилка збереження' }
    },
    null,
  )

  const current = locale === 'ru' ? data.ru : data.uk

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-100">Метод</h3>
        <p className="text-sm text-zinc-500 mt-1">Таймлайн процесу — кроки від знайомства до результату</p>
      </div>

      <LocaleTabs active={locale} onChange={setLocale} />

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Заголовок</label>
          <input name="heading" defaultValue={current.heading} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Підзаголовок</label>
          <textarea name="subtitle" defaultValue={current.subtitle} rows={2} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none" />
        </div>

        <div className="space-y-4">
          <label className="block text-xs font-medium text-zinc-400">Кроки (до 4)</label>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 text-xs flex items-center justify-center font-bold">{i + 1}</span>
                <input name={`item${i}_title`} defaultValue={current.items?.[i]?.title ?? ''} placeholder={`Крок ${i + 1}`} className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none" />
                <input name={`item${i}_duration`} defaultValue={current.items?.[i]?.duration ?? ''} placeholder="Тривалість" className="w-28 rounded-lg border border-zinc-700 bg-zinc-800/50 px-2 py-1.5 text-xs text-zinc-400 focus:border-amber-500/50 focus:outline-none" />
              </div>
              <textarea name={`item${i}_description`} defaultValue={current.items?.[i]?.description ?? ''} rows={2} placeholder="Опис кроку" className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none" />
            </div>
          ))}
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
