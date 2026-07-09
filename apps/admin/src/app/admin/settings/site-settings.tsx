'use client'

import { useState } from 'react'
import { updateSiteSetting, deleteSiteSetting } from '@/lib/actions/settings'

interface Props {
  settings: { key: string; valueJson: string | null }[]
}

export function SiteSettingsList({ settings }: Props) {
  const [editing, setEditing] = useState<string | null>(null)
  const [key, setKey] = useState('')
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await updateSiteSetting(key, value)
      setEditing(null)
      setKey('')
      setValue('')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(k: string) {
    if (!confirm('Видалити налаштування?')) return
    await deleteSiteSetting(k)
  }

  function startEdit(k: string, v: string | null) {
    setEditing(k)
    setKey(k)
    setValue(v ?? '')
  }

  return (
    <div>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-zinc-800/30">
            <th className="text-left p-2 border border-zinc-700 text-zinc-500 font-medium">Ключ</th>
            <th className="text-left p-2 border border-zinc-700 text-zinc-500 font-medium">Значення</th>
            <th className="p-2 border border-zinc-700 text-zinc-500 font-medium w-32">Дії</th>
          </tr>
        </thead>
        <tbody>
          {settings.map((s) =>
            editing === s.key ? (
              <tr key={s.key}>
                <td colSpan={3} className="p-2 border border-zinc-700">
                  <form onSubmit={handleSave} className="flex gap-2 items-start">
                    <input
                      className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-2 py-1.5 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 w-48"
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                      placeholder="Ключ"
                      required
                    />
                    <textarea
                      className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-2 py-1.5 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 flex-1"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder='JSON значение или текст'
                      rows={2}
                    />
                    <button type="submit" disabled={loading} className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-500">
                      {loading ? '...' : 'Зберегти'}
                    </button>
                    <button type="button" onClick={() => setEditing(null)} className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800">
                      Скасувати
                    </button>
                  </form>
                </td>
              </tr>
            ) : (
              <tr key={s.key}>
                <td className="p-2 border border-zinc-700 font-mono text-xs text-zinc-400">{s.key}</td>
                <td className="p-2 border border-zinc-700 max-w-xs truncate text-zinc-300">{s.valueJson}</td>
                <td className="p-2 border border-zinc-700">
                  <button onClick={() => startEdit(s.key, s.valueJson)} className="text-amber-400 hover:text-amber-300 mr-2 text-sm">
                    Редагувати
                  </button>
                  <button onClick={() => handleDelete(s.key)} className="text-red-400 hover:text-red-300 text-sm">
                    Видалити
                  </button>
                </td>
              </tr>
            )
          )}
          {!editing && (
            <tr>
              <td colSpan={3} className="p-2 border border-zinc-700">
                <button onClick={() => startEdit('', '')} className="text-green-400 hover:text-green-300 text-sm">
                  + Додати параметр
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
