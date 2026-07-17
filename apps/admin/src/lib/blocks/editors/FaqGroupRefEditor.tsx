'use client'

import type { BlockEditorProps } from '../types'

const FAQ_GROUPS = [
  { value: 'GENERAL', label: 'Общие вопросы', labelUk: 'Загальні питання' },
  { value: 'HOME', label: 'Главная страница', labelUk: 'Головна сторінка' },
  { value: 'SERVICE', label: 'Услуги', labelUk: 'Послуги' },
  { value: 'CONTACTS', label: 'Контакты', labelUk: 'Контакти' },
] as const

export function FaqGroupRefEditor({ content, onChange, locale }: BlockEditorProps) {
  const title = (content.title as string) ?? ''
  const group = (content.group as string) ?? 'GENERAL'

  const update = (field: string, value: string) => {
    onChange({ ...content, [field]: value })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Заголовок</label>
        <input
          value={title}
          onChange={(e) => update('title', e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          placeholder="Часто задаваемые вопросы"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Группа FAQ</label>
        <div className="flex gap-2 flex-wrap">
          {FAQ_GROUPS.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => update('group', g.value)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                group === g.value
                  ? 'bg-amber-600/20 text-amber-400 border border-amber-600/30'
                  : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:border-zinc-600'
              }`}
            >
              {locale === 'uk' ? g.labelUk : g.label}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-dashed border-zinc-700/50 bg-zinc-900/20 p-3">
        <p className="text-xs text-zinc-500">
          ⚡ Вопросы и ответы загружаются из CRM автоматически по выбранной группе.
        </p>
      </div>
    </div>
  )
}
