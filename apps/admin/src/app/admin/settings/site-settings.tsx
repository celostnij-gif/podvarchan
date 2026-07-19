'use client'

import { useState, useCallback } from 'react'
import { updateSiteSetting, deleteSiteSetting } from '@/lib/actions/settings'

interface Props {
  settings: { key: string; valueJson: string | null }[]
}

/* ── Known key definitions ── */

interface KnownKeyDef {
  key: string
  label: string
  description: string
  type: 'text' | 'textarea' | 'url' | 'email' | 'json'
  placeholder?: string
}

const KNOWN_KEYS: KnownKeyDef[] = [
  { key: 'site_name', label: 'Назва сайту', description: 'Використовується в SEO та соцмережах', type: 'text', placeholder: 'Podvarchan.com' },
  { key: 'site_description', label: 'Опис сайту', description: 'Короткий опис для SEO', type: 'textarea', placeholder: 'Гіпнотерапія онлайн' },
  { key: 'contact_email', label: 'Email для зв\'язку', description: 'Основний email контактів', type: 'email', placeholder: 'info@podvarchan.com' },
  { key: 'social_links', label: 'Посилання на соцмережі', description: 'JSON-масив {platform, url}', type: 'json', placeholder: '[{"platform":"telegram","url":"https://t.me/..."}]' },
  { key: 'working_hours', label: 'Години роботи', description: 'Графік роботи у зрозумілому форматі', type: 'text', placeholder: 'Пн-Пт 10:00–20:00' },
  { key: 'analytics_id', label: 'ID аналітики', description: 'Google Analytics / GTM ID', type: 'text', placeholder: 'G-XXXXXXXXXX' },
  { key: 'turnstile_site_key', label: 'Turnstile Site Key', description: 'Cloudflare Turnstile widget key', type: 'text', placeholder: '0x4AAAA...' },
]

const KNOWN_MAP = new Map(KNOWN_KEYS.map((k) => [k.key, k]))

/* ── Inline editor for a single setting ── */

function SettingInlineEditor({
  settingKey,
  valueJson,
  onSave,
  onDelete,
  onCancel,
}: {
  settingKey: string
  valueJson: string | null
  onSave: (key: string, value: string) => Promise<void>
  onDelete: (key: string) => Promise<void>
  onCancel: () => void
}) {
  const [localKey, setLocalKey] = useState(settingKey)
  const [localValue, setLocalValue] = useState(valueJson ?? '')
  const [loading, setLoading] = useState(false)
  const isNew = !valueJson && !KNOWN_MAP.has(settingKey) // only show key edit for new custom keys
  const known = KNOWN_MAP.get(localKey)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave(localKey, localValue)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-3 rounded-lg border border-zinc-700/50 bg-zinc-800/40 p-4">
      <div className="flex items-start gap-3">
        {/* Key field */}
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            {known ? (
              <span className="text-amber-400/80">{known.label}</span>
            ) : (
              'Ключ'
            )}
          </label>
          {isNew ? (
            <input
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
              list="known-keys-suggest"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
              placeholder="Введіть або оберіть ключ"
              required
            />
          ) : (
            <div className="rounded-lg border border-zinc-700/30 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-300">
              {localKey}
              {known && (
                <span className="ml-2 text-xs text-zinc-600">{known.description}</span>
              )}
            </div>
          )}
          <datalist id="known-keys-suggest">
            {KNOWN_KEYS.filter((k) => k.key !== settingKey).map((k) => (
              <option key={k.key} value={k.key} label={k.label} />
            ))}
          </datalist>
        </div>
      </div>

      {/* Value field */}
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">
          {known ? (known.type === 'json' ? 'Значення (JSON)' : 'Значення') : 'Значення (JSON або текст)'}
        </label>
        {known && (known.type === 'text' || known.type === 'email') ? (
          <input
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            type={known.type === 'email' ? 'email' : 'text'}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            placeholder={known.placeholder}
          />
        ) : (
          <textarea
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            rows={known?.type === 'json' ? 4 : 3}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-sm font-mono text-zinc-200 placeholder-zinc-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            placeholder={known?.placeholder ?? 'Значение'}
          />
        )}
        {known?.type === 'json' && (
          <p className="mt-1 text-xs text-zinc-600">
            JSON має бути валідним — використовуйте подвійні лапки
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50 transition-colors"
        >
          {loading ? '…' : 'Зберегти'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
        >
          Скасувати
        </button>
        {!isNew && (
          <button
            type="button"
            onClick={() => { if (confirm('Видалити налаштування?')) onDelete(localKey) }}
            className="ml-auto rounded-lg px-4 py-2 text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors"
          >
            Видалити
          </button>
        )}
      </div>
    </form>
  )
}

/* ── Main component ── */

export function SiteSettingsList({ settings }: Props) {
  const [editing, setEditing] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'known' | 'custom'>('all')

  const handleSave = useCallback(async (key: string, value: string) => {
    await updateSiteSetting(key, value)
    setEditing(null)
  }, [])

  const handleDelete = useCallback(async (key: string) => {
    await deleteSiteSetting(key)
    setEditing(null)
  }, [])

  const knownKeys = settings.filter((s) => KNOWN_MAP.has(s.key))
  const customKeys = settings.filter((s) => !KNOWN_MAP.has(s.key))
  const displayed = filter === 'all' ? settings : filter === 'known' ? knownKeys : customKeys

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        {(['all', 'known', 'custom'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === tab
                ? 'bg-amber-600/20 text-amber-400'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
            }`}
          >
            {tab === 'all' ? 'Всі' : tab === 'known' ? 'Відомі' : 'Власні'}
            <span className="ml-1.5 rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px]">
              {tab === 'all' ? settings.length : tab === 'known' ? knownKeys.length : customKeys.length}
            </span>
          </button>
        ))}
        <div className="flex-1" />
        {!editing && (
          <button
            onClick={() => setEditing('__new__')}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-900/20 hover:text-green-300 transition-colors"
          >
            + Додати параметр
          </button>
        )}
      </div>

      {/* Known keys section — structured display */}
      {filter !== 'custom' &&
        knownKeys.map((s) =>
          editing === s.key ? (
            <SettingInlineEditor
              key={s.key}
              settingKey={s.key}
              valueJson={s.valueJson}
              onSave={handleSave}
              onDelete={handleDelete}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <div
              key={s.key}
              className="group flex items-start gap-3 rounded-lg border border-zinc-700/50 bg-zinc-900/30 p-3 hover:border-zinc-600/50 transition-colors cursor-pointer"
              onClick={() => setEditing(s.key)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-amber-400/90">{KNOWN_MAP.get(s.key)?.label ?? s.key}</span>
                  <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-500">{s.key}</span>
                </div>
                {KNOWN_MAP.get(s.key)?.description && (
                  <p className="mt-0.5 text-xs text-zinc-600">{KNOWN_MAP.get(s.key)!.description}</p>
                )}
                <div className="mt-1.5 text-sm text-zinc-300 truncate">{s.valueJson}</div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="rounded bg-amber-600/10 px-1.5 py-0.5 text-[10px] text-amber-500">редагувати</span>
              </div>
            </div>
          ),
        )}

      {/* Custom keys section — compact table */}
      {filter !== 'known' &&
        customKeys.map((s) =>
          editing === s.key ? (
            <SettingInlineEditor
              key={s.key}
              settingKey={s.key}
              valueJson={s.valueJson}
              onSave={handleSave}
              onDelete={handleDelete}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <div
              key={s.key}
              className="group flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/20 p-2.5 hover:border-zinc-700/50 transition-colors cursor-pointer"
              onClick={() => setEditing(s.key)}
            >
              <code className="shrink-0 rounded bg-zinc-800/60 px-2 py-1 text-xs text-zinc-400">{s.key}</code>
              <span className="flex-1 truncate text-sm text-zinc-500">{s.valueJson}</span>
              <span className="shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">
                ред
              </span>
            </div>
          ),
        )}

      {/* Empty state */}
      {displayed.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800 py-8 text-zinc-600">
          <p className="text-sm">Параметрів немає</p>
          {filter !== 'all' && (
            <button onClick={() => setFilter('all')} className="mt-2 text-xs text-amber-500 hover:text-amber-400">
              Показати всі
            </button>
          )}
        </div>
      )}

      {/* New setting editor */}
      {editing === '__new__' && (
        <SettingInlineEditor
          key="__new__"
          settingKey=""
          valueJson={null}
          onSave={handleSave}
          onDelete={handleDelete}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  )
}
