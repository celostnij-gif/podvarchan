'use client'

import { useActionState, useState } from 'react'
import { updateHomeZone } from '@/lib/actions/home'
import { LocaleTabs } from '../components/LocaleTabs'
import { LinkedEntityCard } from '../components/LinkedEntityCard'
import type { ServicesContent } from '@/lib/home/blueprint'

interface ServicesZoneProps {
  data: { ru: ServicesContent; uk: ServicesContent }
  featuredCount: number
}

export function ServicesZone({ data, featuredCount }: ServicesZoneProps) {
  const [locale, setLocale] = useState<'ru' | 'uk'>('ru')
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; saved?: boolean } | null, formData: FormData) => {
      const content: ServicesContent = {
        heading: (formData.get('heading') as string) ?? '',
        subtitle: (formData.get('subtitle') as string) ?? '',
        allLink: (formData.get('allLink') as string) ?? '',
      }
      const result = await updateHomeZone({ zone: 'services', locale, content })
      if (result.ok) return { saved: true }
      return { error: 'Помилка збереження' }
    },
    null,
  )

  const current = locale === 'ru' ? data.ru : data.uk

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-100">Послуги</h3>
        <p className="text-sm text-zinc-500 mt-1">Заголовок секції. Картки послуг керуються окремо.</p>
      </div>

      <LinkedEntityCard
        label="Опубліковані послуги"
        count={featuredCount}
        href="/admin/services"
        accent={featuredCount > 0}
      />

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
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Текст посилання «Усі послуги»</label>
          <input name="allLink" defaultValue={current.allLink} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none" />
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
