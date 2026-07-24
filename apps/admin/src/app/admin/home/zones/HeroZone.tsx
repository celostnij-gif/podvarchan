'use client'

import { useActionState, useState } from 'react'
import { updateHomeZone } from '@/lib/actions/home'
import { LocaleTabs } from '../components/LocaleTabs'
import type { HeroContent } from '@/lib/home/blueprint'

interface HeroZoneProps {
  data: {
    ru: HeroContent
    uk: HeroContent
  }
}

export function HeroZone({ data }: HeroZoneProps) {
  const [locale, setLocale] = useState<'ru' | 'uk'>('ru')
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; saved?: boolean } | null, formData: FormData) => {
      const content: HeroContent = {
        title: (formData.get('title') as string) ?? '',
        subtitle: (formData.get('subtitle') as string) ?? '',
        ctaPrimary: (formData.get('ctaPrimary') as string) ?? '',
        ctaSecondary: (formData.get('ctaSecondary') as string) ?? '',
        benefits: [
          (formData.get('benefit1') as string) ?? '',
          (formData.get('benefit2') as string) ?? '',
          (formData.get('benefit3') as string) ?? '',
        ].filter(Boolean),
      }
      const result = await updateHomeZone({ zone: 'hero', locale, content })
      if (result.ok) return { saved: true }
      return { error: 'Помилка збереження' }
    },
    null,
  )

  const current = locale === 'ru' ? data.ru : data.uk

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-100">Hero / Головний екран</h3>
        <p className="text-sm text-zinc-500 mt-1">Заголовок, підзаголовок, кнопки та бейджі</p>
      </div>

      <LocaleTabs active={locale} onChange={setLocale} />

      <form key={locale} action={formAction} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Заголовок (H1)</label>
          <input
            name="title"
            defaultValue={current.title}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            placeholder="Избавиться от тревоги и панических атак"
          />
          <p className="text-xs text-zinc-600 mt-1">Синхронізується з page_translations.title</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Підзаголовок</label>
          <textarea
            name="subtitle"
            defaultValue={current.subtitle}
            rows={3}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            placeholder="Помогаю справиться с тревогой через эриксоновский гипноз..."
          />
          <p className="text-xs text-zinc-600 mt-1">Синхронізується з page_translations.excerpt</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">CTA Primary</label>
            <input
              name="ctaPrimary"
              defaultValue={current.ctaPrimary}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
              placeholder="Записаться на консультацию"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">CTA Secondary</label>
            <input
              name="ctaSecondary"
              defaultValue={current.ctaSecondary}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
              placeholder="Узнать о методе"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-2">Бейджі переваг</label>
          {[0, 1, 2].map((i) => (
            <input
              key={i}
              name={`benefit${i + 1}`}
              defaultValue={current.benefits?.[i] ?? ''}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 mb-2"
              placeholder={`Перевага ${i + 1}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="px-4 py-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-sm font-medium hover:bg-amber-500/20 transition-colors disabled:opacity-50"
          >
            {pending ? 'Збереження...' : 'Зберегти Hero'}
          </button>
          {state?.saved && <span className="text-xs text-green-400">Збережено</span>}
          {state?.error && <span className="text-xs text-red-400">{state.error}</span>}
        </div>
      </form>
    </div>
  )
}
