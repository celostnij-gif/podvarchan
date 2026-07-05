'use client'

import { useState } from 'react'
import { saveRedirectRule, deleteRedirectRule, toggleRedirectRule } from '@/app/admin/actions/settings'
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
    if (!confirm('Видалити правило?')) return
    await deleteRedirectRule(id)
  }

  function renderForm(rule?: Rule) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-end">
        {rule && <input type="hidden" name="id" value={rule.id} />}
        <input name="fromPath" defaultValue={rule?.fromPath ?? ''} className="border rounded px-2 py-1 text-sm w-64" placeholder="/from-path" required />
        <input name="toPath" defaultValue={rule?.toPath ?? ''} className="border rounded px-2 py-1 text-sm w-64" placeholder="/to-path" required />
        <select name="statusCode" defaultValue={rule?.statusCode ?? 301} className="border rounded px-2 py-1 text-sm">
          <option value={301}>301 (постійний)</option>
          <option value={302}>302 (тимчасовий)</option>
        </select>
        <label className="flex items-center gap-1 text-xs">
          <input type="checkbox" name="isEnabled" defaultChecked={rule?.isEnabled ?? true} /> Вкл
        </label>
        <div className="flex gap-1">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
            {loading ? '...' : 'Збр'}
          </button>
          <button type="button" onClick={() => setEditing(null)} className="px-3 py-1 rounded text-sm border hover:bg-gray-100">
            X
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="space-y-2">
      {rules.length === 0 && !editing && (
        <p className="text-sm text-gray-400">Немає правил редиректу</p>
      )}
      {rules.map((r) =>
        editing === r.id ? (
          <div key={r.id} className="p-3 border rounded bg-gray-50">
            {renderForm(r)}
          </div>
        ) : (
          <div key={r.id} className={`flex items-center gap-3 p-2 border rounded ${r.isEnabled ? '' : 'opacity-50'}`}>
            <span className={`px-2 py-0.5 rounded text-xs font-mono ${r.statusCode === 301 ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
              {r.statusCode}
            </span>
            <code className="text-sm flex-1">{r.fromPath}</code>
            <span className="text-gray-400">→</span>
            <code className="text-sm flex-1">{r.toPath}</code>
            <span className="text-xs text-gray-500">{r.hitCount ?? 0} hits</span>
            {!r.isEnabled && <span className="text-xs text-red-500">вимкнено</span>}
            <button onClick={() => toggleRedirectRule(r.id)} className="text-xs text-gray-500 hover:text-gray-700">
              {r.isEnabled ? 'Вимк' : 'Увімк'}
            </button>
            <button onClick={() => setEditing(r.id)} className="text-blue-600 hover:underline text-sm">Ред</button>
            <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:underline text-sm">Дел</button>
          </div>
        )
      )}
      {!editing && (
        <button onClick={() => setEditing('__new__')} className="text-green-600 hover:underline text-sm">
          + Додати правило
        </button>
      )}
      {editing === '__new__' && (
        <div className="p-3 border rounded bg-gray-50">
          {renderForm()}
        </div>
      )}
    </div>
  )
}
