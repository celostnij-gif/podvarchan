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
          <tr className="bg-gray-100">
            <th className="text-left p-2 border">Ключ</th>
            <th className="text-left p-2 border">Значення</th>
            <th className="p-2 border w-32">Дії</th>
          </tr>
        </thead>
        <tbody>
          {settings.map((s) =>
            editing === s.key ? (
              <tr key={s.key}>
                <td colSpan={3} className="p-2 border">
                  <form onSubmit={handleSave} className="flex gap-2 items-start">
                    <input
                      className="border rounded px-2 py-1 w-48"
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                      placeholder="Ключ"
                      required
                    />
                    <textarea
                      className="border rounded px-2 py-1 flex-1"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder='JSON значение или текст'
                      rows={2}
                    />
                    <button type="submit" disabled={loading} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                      {loading ? '...' : 'Зберегти'}
                    </button>
                    <button type="button" onClick={() => setEditing(null)} className="px-3 py-1 rounded border hover:bg-gray-100">
                      Скасувати
                    </button>
                  </form>
                </td>
              </tr>
            ) : (
              <tr key={s.key}>
                <td className="p-2 border font-mono text-xs">{s.key}</td>
                <td className="p-2 border max-w-xs truncate">{s.valueJson}</td>
                <td className="p-2 border">
                  <button onClick={() => startEdit(s.key, s.valueJson)} className="text-blue-600 hover:underline mr-2">
                    Редагувати
                  </button>
                  <button onClick={() => handleDelete(s.key)} className="text-red-600 hover:underline">
                    Видалити
                  </button>
                </td>
              </tr>
            )
          )}
          {!editing && (
            <tr>
              <td colSpan={3} className="p-2 border">
                <button onClick={() => startEdit('', '')} className="text-green-600 hover:underline">
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
