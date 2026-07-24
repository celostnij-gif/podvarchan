'use client'

import { useActionState, useState } from 'react'
import { updateHomeZone } from '@/lib/actions/home'
import { LocaleTabs } from '../components/LocaleTabs'
import type { AuthorContent } from '@/lib/home/blueprint'

interface AuthorZoneProps {
  data: { ru: AuthorContent; uk: AuthorContent }
}

export function AuthorZone({ data }: AuthorZoneProps) {
  const [locale, setLocale] = useState<'ru' | 'uk'>('ru')
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; saved?: boolean } | null, formData: FormData) => {
      const paragraphs = [
        formData.get('paragraph1') as string,
        formData.get('paragraph2') as string,
        formData.get('paragraph3') as string,
      ].filter(Boolean)
      const content: AuthorContent = {
        headingPrefix: (formData.get('headingPrefix') as string) ?? '',
        headingHighlight: (formData.get('headingHighlight') as string) ?? '',
        headingSuffix: (formData.get('headingSuffix') as string) ?? '',
        paragraphs,
        readMore: (formData.get('readMore') as string) ?? '',
        readMoreLink: (formData.get('readMoreLink') as string) ?? '',
        experience: (formData.get('experience') as string) ?? '',
        education: (formData.get('education') as string) ?? '',
      }
      const result = await updateHomeZone({ zone: 'author', locale, content })
      if (result.ok) return { saved: true }
      return { error: 'Помилка збереження' }
    },
    null,
  )

  const current = locale === 'ru' ? data.ru : data.uk

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-100">Автор / О собі</h3>
        <p className="text-sm text-zinc-500 mt-1">Превʼю блок автора — заголовок, абзаци, досвід, освіта</p>
      </div>

      <LocaleTabs active={locale} onChange={setLocale} />

      <form key={locale} action={formAction} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Prefix</label>
            <input name="headingPrefix" defaultValue={current.headingPrefix} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Акцент</label>
            <input name="headingHighlight" defaultValue={current.headingHighlight} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Suffix</label>
            <input name="headingSuffix" defaultValue={current.headingSuffix} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-zinc-400">Абзаци (до 3)</label>
          {[0, 1, 2].map((i) => (
            <textarea key={i} name={`paragraph${i + 1}`} defaultValue={current.paragraphs?.[i] ?? ''} rows={3} placeholder={`Абзац ${i + 1}`} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none" />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Текст посилання</label>
            <input name="readMore" defaultValue={current.readMore} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Посилання</label>
            <input name="readMoreLink" defaultValue={current.readMoreLink} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Досвід</label>
            <input name="experience" defaultValue={current.experience} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Освіта</label>
            <input name="education" defaultValue={current.education} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none" />
          </div>
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
