'use client'

import { useState } from 'react'
import { saveContactChannel, deleteContactChannel } from '@/lib/actions/settings'
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
        <select name="type" defaultValue={channel?.type ?? 'CUSTOM'} className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-2 py-1.5 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30" required>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input name="label" defaultValue={channel?.label ?? ''} className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-2 py-1.5 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30" placeholder="Мітка" />
        <input name="value" defaultValue={channel?.value ?? ''} className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-2 py-1.5 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30" placeholder="Значення" />
        <input name="url" defaultValue={channel?.url ?? ''} className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-2 py-1.5 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30" placeholder="URL" />
        <div className="flex gap-2 items-center">
          <label className="text-xs text-zinc-400">
            <input type="checkbox" name="isPrimary" defaultChecked={channel?.isPrimary ?? false} className="rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500" /> Основной
          </label>
          <label className="text-xs text-zinc-400">
            <input type="checkbox" name="isEnabled" defaultChecked={channel?.isEnabled ?? true} className="rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500" /> Вкл
          </label>
        </div>
        <div className="flex gap-1">
          <button type="submit" disabled={loading} className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50">
            {loading ? '…' : 'Зберегти'}
          </button>
          <button type="button" onClick={() => setEditing(null)} className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800">
            Скасувати
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="space-y-2">
      {channels.map((ch) =>
        editing === ch.id ? (
          <div key={ch.id} className="p-3 border border-zinc-700/50 rounded-lg bg-zinc-900/40">
            {renderForm(ch)}
          </div>
        ) : (
          <div key={ch.id} className="flex items-center gap-3 p-2.5 border border-zinc-700/50 rounded-lg bg-zinc-900/30">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${ch.isEnabled ? 'bg-green-900/30 text-green-400 border border-green-700/30' : 'bg-zinc-800 text-zinc-500 border border-zinc-700/50'}`}>
              {ch.type === 'TELEGRAM' && '📱'}
              {ch.type === 'WHATSAPP' && '💬'}
              {ch.type === 'EMAIL' && '✉️'}
              {ch.type === 'PHONE' && '📞'}
              {ch.type === 'CUSTOM' && '🔗'}
              {ch.type}
            </span>
            <span className="flex-1 text-sm text-zinc-200 font-medium">{ch.label}</span>
            <span className="text-sm text-zinc-400 truncate max-w-[200px]">{ch.value}</span>
            {ch.isPrimary && <span className="text-xs bg-amber-900/30 text-amber-400 border border-amber-700/30 px-1.5 py-0.5 rounded font-medium">PRIMARY</span>}
            <button onClick={() => setEditing(ch.id)} className="rounded px-2 py-1 text-xs text-amber-400 hover:bg-zinc-800 hover:text-amber-300 transition-colors">Редагувати</button>
            <button onClick={() => handleDelete(ch.id)} className="rounded px-2 py-1 text-xs text-red-400 hover:bg-zinc-800 hover:text-red-300 transition-colors">Видалити</button>
          </div>
        )
      )}
      {!editing && (
        <button onClick={() => setEditing('__new__')} className="text-green-400 hover:text-green-300 text-sm">
          + Додати канал
        </button>
      )}
      {editing === '__new__' && (
        <div className="p-3 border border-zinc-700/50 rounded-lg bg-zinc-900/40">
          {renderForm()}
        </div>
      )}
    </div>
  )
}
