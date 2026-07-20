'use client'

import { useState } from 'react'
import { updateHomeContent } from '@/lib/actions/pages'
import { SectionEditor } from '@/app/admin/pages/[id]/section-editor'
import { HeroEditor } from '@/lib/blocks/editors/HeroEditor'
import type { PageTranslationRecord, PageSectionWithTranslations } from '@/app/admin/pages/types'

interface HomeEditorProps {
  pageId: string
  status: string
  tr: {
    ru: PageTranslationRecord | null
    uk: PageTranslationRecord | null
  }
  hero: {
    ru: { title: string; subtitle: string; cta: string }
    uk: { title: string; subtitle: string; cta: string }
  }
  sections: PageSectionWithTranslations[]
}

export function HomeEditor({ pageId, status, tr, hero, sections }: HomeEditorProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // State for hero editor
  const [ruHero, setRuHero] = useState({ title: hero.ru.title, subtitle: hero.ru.subtitle, cta: hero.ru.cta })
  const [ukHero, setUkHero] = useState({ title: hero.uk.title, subtitle: hero.uk.subtitle, cta: hero.uk.cta })

  async function handleSave(formData: FormData) {
    formData.set('ru_heroTitle', ruHero.title)
    formData.set('ru_heroSubtitle', ruHero.subtitle)
    formData.set('ru_heroCta', ruHero.cta)
    formData.set('uk_heroTitle', ukHero.title)
    formData.set('uk_heroSubtitle', ukHero.subtitle)
    formData.set('uk_heroCta', ukHero.cta)

    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await updateHomeContent(formData)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Невідома помилка')
    } finally {
      setSaving(false)
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    await handleSave(fd)
  }

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-6">
      {/* Status */}
      <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/40 p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-100">Параметри</h2>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Статус</label>
          <select
            name="status"
            defaultValue={status}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          >
            <option value="DRAFT">Чернетка</option>
            <option value="PUBLISHED">Опубліковано</option>
            <option value="ARCHIVED">Архів</option>
          </select>
        </div>
      </div>

      {/* Russian */}
      <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/40 p-6">
        <h2 className="mb-4 text-lg font-semibold text-amber-400">🇷🇺 Російська</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-300 mb-1">URL (slug)</label>
          <div className="flex items-center gap-1 text-sm text-zinc-500">
            <span>/ru/</span>
            <input
              name="ru_slug"
              defaultValue={tr.ru?.slug ?? '/'}
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-300 mb-1">Назва (title)</label>
          <input
            name="ru_title"
            defaultValue={tr.ru?.title ?? ''}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-300 mb-1">Короткий опис (excerpt)</label>
          <textarea
            name="ru_excerpt"
            defaultValue={tr.ru?.excerpt ?? ''}
            rows={2}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>

        <div className="border-t border-amber-500/20 pt-4 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🏠</span>
            <span className="text-sm font-semibold text-zinc-200">Hero-блок</span>
            <span className="text-xs text-zinc-500">Головний екран</span>
          </div>
          <HeroEditor content={ruHero} onChange={(c) => setRuHero(c as { title: string; subtitle: string; cta: string })} locale="ru" />
        </div>
      </div>

      {/* Ukrainian */}
      <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/40 p-6">
        <h2 className="mb-4 text-lg font-semibold text-blue-400">🇺🇦 Українська</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-300 mb-1">URL (slug)</label>
          <div className="flex items-center gap-1 text-sm text-zinc-500">
            <span>/uk/</span>
            <input
              name="uk_slug"
              defaultValue={tr.uk?.slug ?? '/'}
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-300 mb-1">Назва (title)</label>
          <input
            name="uk_title"
            defaultValue={tr.uk?.title ?? ''}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-300 mb-1">Короткий опис (excerpt)</label>
          <textarea
            name="uk_excerpt"
            defaultValue={tr.uk?.excerpt ?? ''}
            rows={2}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>

        <div className="border-t border-blue-500/20 pt-4 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🏠</span>
            <span className="text-sm font-semibold text-zinc-200">Hero-блок</span>
            <span className="text-xs text-zinc-500">Головний екран</span>
          </div>
          <HeroEditor content={ukHero} onChange={(c) => setUkHero(c as { title: string; subtitle: string; cta: string })} locale="uk" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {error && <p className="text-sm text-red-400">{error}</p>}
        {saved && !error && (
          <span className="rounded-lg bg-green-900/30 text-green-400 px-3 py-1.5 text-sm border border-green-700/30 inline-flex items-center gap-1">
            ✓ Збережено
          </span>
        )}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-amber-600 px-6 py-2 text-sm font-medium text-white hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {saving ? 'Збереження…' : 'Зберегти'}
        </button>
      </div>

      {/* Sections */}
      <div className="border-t border-zinc-800/50 pt-6">
        <SectionEditor pageId={pageId} sections={sections} />
      </div>
    </form>
  )
}
