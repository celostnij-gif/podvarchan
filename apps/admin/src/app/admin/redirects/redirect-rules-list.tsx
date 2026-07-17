'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Power, PowerOff, ExternalLink, ArrowRight } from 'lucide-react'
import { saveRedirectRule, deleteRedirectRule, toggleRedirectRule } from '@/lib/actions/redirects'
import type { InferSelectModel } from 'drizzle-orm'
import type { redirectRules as redirectSchema } from '@/db/schema/settings'

type Rule = InferSelectModel<typeof redirectSchema>

interface Props {
  rules: Rule[]
}

export function RedirectRulesList({ rules }: Props) {
  const [editing, setEditing] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      const form = new FormData(e.currentTarget)
      await saveRedirectRule(form)
      setEditing(null)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить правило редиректа?')) return
    await deleteRedirectRule(id)
  }

  function renderForm(rule?: Rule) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        {rule && <input type="hidden" name="id" value={rule.id} />}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Откуда</label>
          <input
            name="fromPath"
            defaultValue={rule?.fromPath ?? ''}
            required
            placeholder="/old-page"
            className="w-56 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500
                       focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Куда</label>
          <input
            name="toPath"
            defaultValue={rule?.toPath ?? ''}
            required
            placeholder="/new-page"
            className="w-56 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500
                       focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Тип</label>
          <select
            name="statusCode"
            defaultValue={rule?.statusCode ?? 301}
            className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200
                       focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          >
            <option value={301}>301 (постоянный)</option>
            <option value={302}>302 (временный)</option>
          </select>
        </div>
        <div className="flex items-center gap-3 pb-0.5">
          <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              name="isEnabled"
              defaultChecked={rule?.isEnabled ?? true}
              className="rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500"
            />
            Вкл
          </label>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50 transition-colors"
          >
            {loading ? '…' : 'Сохранить'}
          </button>
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 transition-colors"
          >
            Отмена
          </button>
        </div>
      </form>
    )
  }

  const totalEnabled = rules.filter((r) => r.isEnabled).length

  return (
    <div className="space-y-3">
      {/* Stats bar */}
      <div className="flex items-center justify-between text-xs text-zinc-500 border-b border-zinc-800 pb-2">
        <span>
          Всего правил: <strong className="text-zinc-300">{rules.length}</strong>
          {' · '}
          Активно: <strong className="text-green-400">{totalEnabled}</strong>
          {' · '}
          Отключено: <strong className="text-zinc-500">{rules.length - totalEnabled}</strong>
        </span>
        {rules.length > 0 && (
          <span className="text-zinc-600">
            Всего переходов: {rules.reduce((sum, r) => sum + (r.hitCount ?? 0), 0)}
          </span>
        )}
      </div>

      {/* Rules list */}
      {rules.length === 0 && !editing && (
        <div className="flex flex-col items-center justify-center py-12 text-zinc-600 border border-dashed border-zinc-800 rounded-lg">
          <ExternalLink className="h-8 w-8 mb-2 opacity-50" />
          <p className="text-sm">Нет правил редиректа</p>
          <p className="text-xs mt-1">Добавьте правило, чтобы настроить перенаправление URL</p>
        </div>
      )}

      <div className="space-y-2">
        {rules.map((r) =>
          editing === r.id ? (
            <div key={r.id} className="rounded-lg border border-zinc-700/50 bg-zinc-800/40 p-4">
              {renderForm(r)}
            </div>
          ) : (
            <div
              key={r.id}
              className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
                r.isEnabled
                  ? 'border-zinc-700/50 bg-zinc-900/40'
                  : 'border-dashed border-zinc-700/30 bg-zinc-900/20 opacity-60'
              }`}
            >
              {/* Status code badge */}
              <span
                className={`shrink-0 rounded px-2 py-0.5 text-xs font-mono font-medium ${
                  r.statusCode === 301
                    ? 'bg-orange-900/30 text-orange-400 border border-orange-700/30'
                    : 'bg-blue-900/30 text-blue-400 border border-blue-700/30'
                }`}
              >
                {r.statusCode}
              </span>

              {/* From → To */}
              <code className="text-sm text-zinc-300 font-mono truncate max-w-[200px]">{r.fromPath}</code>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
              <code className="text-sm text-zinc-300 font-mono truncate max-w-[200px]">{r.toPath}</code>

              {/* Hit count */}
              <span className="shrink-0 rounded bg-zinc-800/60 px-2 py-0.5 text-xs text-zinc-500 font-mono">
                {r.hitCount ?? 0} hits
              </span>

              {/* Disabled badge */}
              {!r.isEnabled && (
                <span className="shrink-0 text-xs text-red-500 font-medium">отключено</span>
              )}

              <div className="flex-1" />

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleRedirectRule(r.id)}
                  className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
                  title={r.isEnabled ? 'Отключить' : 'Включить'}
                >
                  {r.isEnabled ? <Power className="h-3.5 w-3.5" /> : <PowerOff className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => setEditing(r.id)}
                  className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-amber-400 transition-colors"
                  title="Редактировать"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-red-400 transition-colors"
                  title="Удалить"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ),
        )}
      </div>

      {/* Add new button */}
      {!editing && (
        <button
          onClick={() => setEditing('__new__')}
          className="flex items-center gap-2 rounded-lg border border-dashed border-zinc-700/50 py-3 px-4 w-full text-sm text-zinc-500 hover:border-zinc-600 hover:text-zinc-400 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Добавить правило
        </button>
      )}

      {editing === '__new__' && (
        <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/40 p-4">
          <p className="text-xs font-medium text-zinc-400 mb-3">Новое правило редиректа</p>
          {renderForm()}
        </div>
      )}
    </div>
  )
}
