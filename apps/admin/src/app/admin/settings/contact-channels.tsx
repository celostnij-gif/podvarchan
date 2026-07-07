'use client'

import { useState } from 'react'
import { saveContactChannel, deleteContactChannel } from '@/app/admin/actions/settings'
import type { InferSelectModel } from 'drizzle-orm'
import type { contactChannels as contactChannelsSchema } from '@/db/schema/settings'

type Channel = InferSelectModel<typeof contactChannelsSchema>

interface Props {
  channels: Channel[]
}

const TYPES = ['TELEGRAM', 'WHATSAPP', 'EMAIL', 'PHONE', 'CUSTOM'] as const

export function ContactChannelList({ channels }: Props) {
  const [editing, setEditing] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      const form = new FormData(e.currentTarget)
      await saveContactChannel(form)
      setEditing(null)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Видалити канал?')) return
    await deleteContactChannel(id)
  }

  function renderForm(channel?: Channel) {
    return (
      <form onSubmit={handleSubmit} className="grid grid-cols-6 gap-2 items-end">
        {channel && <input type="hidden" name="id" value={channel.id} />}
        <select name="type" defaultValue={channel?.type ?? 'CUSTOM'} className="border rounded px-2 py-1 text-sm" required>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input name="label" defaultValue={channel?.label ?? ''} className="border rounded px-2 py-1 text-sm" placeholder="Мітка" />
        <input name="value" defaultValue={channel?.value ?? ''} className="border rounded px-2 py-1 text-sm" placeholder="Значення" />
        <input name="url" defaultValue={channel?.url ?? ''} className="border rounded px-2 py-1 text-sm" placeholder="URL" />
        <div className="flex gap-2 items-center">
          <label className="text-xs">
            <input type="checkbox" name="isPrimary" defaultChecked={channel?.isPrimary ?? false} /> Основной
          </label>
          <label className="text-xs">
            <input type="checkbox" name="isEnabled" defaultChecked={channel?.isEnabled ?? true} /> Вкл
          </label>
        </div>
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
      {channels.map((ch) =>
        editing === ch.id ? (
          <div key={ch.id} className="p-3 border rounded bg-gray-50">
            {renderForm(ch)}
          </div>
        ) : (
          <div key={ch.id} className="flex items-center gap-3 p-2 border rounded">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${ch.isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
              {ch.type}
            </span>
            <span className="flex-1 text-sm">{ch.label}</span>
            <span className="text-sm text-gray-600">{ch.value}</span>
            {ch.isPrimary && <span className="text-xs bg-yellow-100 px-1.5 py-0.5 rounded">PRIMARY</span>}
            <button onClick={() => setEditing(ch.id)} className="text-blue-600 hover:underline text-sm">Ред</button>
            <button onClick={() => handleDelete(ch.id)} className="text-red-600 hover:underline text-sm">Дел</button>
          </div>
        )
      )}
      {!editing && (
        <button onClick={() => setEditing('__new__')} className="text-green-600 hover:underline text-sm">
          + Додати канал
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
