'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, X, Save, Check, ExternalLink } from 'lucide-react'
import { getSiteSettings, updateSiteSetting } from '@/lib/actions/settings'
import { getContactChannels, createContactChannel, updateContactChannel, deleteContactChannel } from '@/lib/actions/settings'
import type { ContactChannel } from '@/db/schema'

/* ── Toast ── */

function Toast({ toast, onClose }: {
  toast: { type: 'success' | 'error'; message: string } | null
  onClose: () => void
}) {
  if (!toast) return null
  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all duration-300 ${
      toast.type === 'success'
        ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-700/50'
        : 'bg-red-900/80 text-red-200 border border-red-700/50'
    }`}>
      {toast.message}
      <button onClick={onClose} className="ml-3 opacity-60 hover:opacity-100">&times;</button>
    </div>
  )
}

/* ── Contact channel form ── */

const CHANNEL_TYPES = [
  { value: 'TELEGRAM', label: 'Telegram' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'CUSTOM', label: 'Custom' },
] as const

const EMPTY_CHANNEL = {
  type: 'TELEGRAM' as string,
  label: '',
  value: '',
  url: '',
  isPrimary: false,
  isEnabled: true,
  sortOrder: 0,
}

/* ── Settings keys to display ── */

const SETTING_FIELDS = [
  { key: 'siteName', label: 'Название сайта', type: 'text' },
  { key: 'siteFullName', label: 'Полное название', type: 'text' },
  { key: 'siteUrl', label: 'URL сайта', type: 'text' },
  { key: 'defaultLocale', label: 'Язык по умолчанию', type: 'text' },
  { key: 'defaultOgImage', label: 'OG Image по умолчанию', type: 'text' },
  { key: 'themeColor', label: 'Цвет темы', type: 'text' },
  { key: 'authorName', label: 'Имя автора', type: 'text' },
  { key: 'authorGivenName', label: 'Имя (given)', type: 'text' },
  { key: 'authorFamilyName', label: 'Фамилия', type: 'text' },
  { key: 'authorJobTitle', label: 'Должность', type: 'text' },
  { key: 'authorDescription', label: 'Описание автора', type: 'textarea' },
  { key: 'authorImage', label: 'Изображение автора', type: 'text' },
]

/* ── Component ── */

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, unknown>>({})
  const [channels, setChannels] = useState<ContactChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [savingKey, setSavingKey] = useState<string | null>(null)

  // Channel form state
  const [showChannelForm, setShowChannelForm] = useState(false)
  const [editChannelId, setEditChannelId] = useState<string | null>(null)
  const [channelForm, setChannelForm] = useState(EMPTY_CHANNEL)
  const [savingChannel, setSavingChannel] = useState(false)

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const reload = useCallback(async () => {
    const [settingsRes, channelsRes] = await Promise.all([
      getSiteSettings(),
      getContactChannels(),
    ])
    if ('data' in settingsRes && settingsRes.data) setSettings(settingsRes.data)
    if ('data' in channelsRes && channelsRes.data) setChannels(channelsRes.data)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true)
      reload().then(() => setLoading(false))
    }, 0)
    return () => clearTimeout(timer)
  }, [reload])

  /* ── Settings handlers ── */

  async function handleSettingChange(key: string, value: string) {
    setSavingKey(key)
    const result = await updateSiteSetting(key, value)
    if ('data' in result) {
      setSettings(prev => ({ ...prev, [key]: value }))
      showToast('success', `${key} сохранён`)
    } else {
      showToast('error', result.error ?? 'Ошибка сохранения')
    }
    setSavingKey(null)
  }

  /* ── Channel handlers ── */

  function openChannelCreate() {
    setEditChannelId(null)
    setChannelForm(EMPTY_CHANNEL)
    setShowChannelForm(true)
  }

  function openChannelEdit(ch: ContactChannel) {
    setEditChannelId(ch.id)
    setChannelForm({
      type: ch.type,
      label: ch.label,
      value: ch.value,
      url: ch.url ?? '',
      isPrimary: ch.isPrimary,
      isEnabled: ch.isEnabled,
      sortOrder: ch.sortOrder,
    })
    setShowChannelForm(true)
  }

  async function handleChannelSave() {
    if (!channelForm.label || !channelForm.value) {
      showToast('error', 'Заполните label и value')
      return
    }
    setSavingChannel(true)
    const data = {
      type: channelForm.type,
      label: channelForm.label,
      value: channelForm.value,
      url: channelForm.url || undefined,
      isPrimary: channelForm.isPrimary,
      isEnabled: channelForm.isEnabled,
      sortOrder: channelForm.sortOrder,
    }
    const result = editChannelId
      ? await updateContactChannel(editChannelId, data)
      : await createContactChannel(data)
    if ('data' in result) {
      showToast('success', editChannelId ? 'Канал обновлён' : 'Канал добавлен')
      setShowChannelForm(false)
      setEditChannelId(null)
      reload()
    } else {
      showToast('error', result.error ?? 'Ошибка')
    }
    setSavingChannel(false)
  }

  async function handleChannelDelete(id: string) {
    if (!confirm('Удалить этот контактный канал?')) return
    const result = await deleteContactChannel(id)
    if ('data' in result) {
      showToast('success', 'Канал удалён')
      reload()
    } else {
      showToast('error', result.error ?? 'Ошибка удаления')
    }
  }

  /* ── Render ── */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-10">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* ── Site Settings ── */}
      <section>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-zinc-100">Настройки сайта</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Основные параметры сайта и информация об авторе</p>
        </div>
        <div className="space-y-3">
          {SETTING_FIELDS.map(field => {
            const value = typeof settings[field.key] === 'string' ? settings[field.key] as string : ''
            return (
              <div key={field.key} className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-medium text-zinc-500 mb-1">{field.label}</label>
                  <p className="text-[10px] text-zinc-700 font-mono mb-1">{field.key}</p>
                  {field.type === 'textarea' ? (
                    <textarea
                      defaultValue={value}
                      rows={3}
                      onBlur={e => handleSettingChange(field.key, e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:border-gold/50 resize-y"
                    />
                  ) : (
                    <input
                      defaultValue={value}
                      onBlur={e => handleSettingChange(field.key, e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700 text-zinc-200 text-sm font-mono focus:outline-none focus:border-gold/50"
                    />
                  )}
                </div>
                <div className="shrink-0 mt-6">
                  {savingKey === field.key ? (
                    <div className="w-7 h-7 rounded-lg bg-emerald-900/30 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                  ) : (
                    <Save className="w-4 h-4 text-zinc-600" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Contact Channels ── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Контактные каналы</h2>
            <p className="text-sm text-zinc-500 mt-0.5">Telegram, WhatsApp, Email и другие способы связи</p>
          </div>
          <button
            onClick={openChannelCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold/10 text-gold hover:bg-gold/20 border border-gold/20 transition-all duration-200 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Добавить канал
          </button>
        </div>

        {/* Channel form modal */}
        {showChannelForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl p-6 mx-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-semibold text-zinc-100">
                  {editChannelId ? 'Редактировать канал' : 'Новый канал'}
                </h3>
                <button onClick={() => { setShowChannelForm(false); setEditChannelId(null) }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Тип</label>
                    <select value={channelForm.type} onChange={e => setChannelForm(f => ({ ...f, type: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:border-gold/50"
                    >
                      {CHANNEL_TYPES.map(ct => (
                        <option key={ct.value} value={ct.value}>{ct.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Sort order</label>
                    <input type="number" value={channelForm.sortOrder}
                      onChange={e => setChannelForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:border-gold/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Название *</label>
                  <input value={channelForm.label} onChange={e => setChannelForm(f => ({ ...f, label: e.target.value }))}
                    placeholder="Telegram"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:border-gold/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Значение *</label>
                  <input value={channelForm.value} onChange={e => setChannelForm(f => ({ ...f, value: e.target.value }))}
                    placeholder="@username или email"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:border-gold/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">URL (опционально)</label>
                  <input value={channelForm.url} onChange={e => setChannelForm(f => ({ ...f, url: e.target.value }))}
                    placeholder="https://t.me/username"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:border-gold/50"
                  />
                </div>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={channelForm.isPrimary}
                      onChange={e => setChannelForm(f => ({ ...f, isPrimary: e.target.checked }))}
                      className="w-4 h-4 rounded bg-zinc-800 border-zinc-600 text-gold focus:ring-gold/30"
                    />
                    <span className="text-sm text-zinc-300">Основной</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={channelForm.isEnabled}
                      onChange={e => setChannelForm(f => ({ ...f, isEnabled: e.target.checked }))}
                      className="w-4 h-4 rounded bg-zinc-800 border-zinc-600 text-gold focus:ring-gold/30"
                    />
                    <span className="text-sm text-zinc-300">Включён</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
                <button onClick={() => { setShowChannelForm(false); setEditChannelId(null) }}
                  className="px-4 py-2 rounded-xl text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                >
                  Отмена
                </button>
                <button onClick={handleChannelSave} disabled={savingChannel}
                  className="px-5 py-2 rounded-xl bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 text-sm font-medium disabled:opacity-50"
                >
                  {savingChannel ? 'Сохранение...' : editChannelId ? 'Сохранить' : 'Добавить'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Channel list */}
        {channels.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-800 rounded-2xl">
            <p className="text-zinc-600 text-sm">Нет контактных каналов</p>
            <button onClick={openChannelCreate}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold/10 text-gold hover:bg-gold/20 border border-gold/20 transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              Добавить канал
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {channels.map(ch => (
              <div key={ch.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900/30 border border-zinc-800/50 hover:border-zinc-700/50 transition-all duration-200 group"
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                  ch.isEnabled ? 'bg-gold/10 text-gold' : 'bg-zinc-800/50 text-zinc-600'
                }`}>
                  {ch.type === 'TELEGRAM' ? 'TG' : ch.type === 'WHATSAPP' ? 'WA' : ch.type === 'EMAIL' ? '@' : ch.type.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-200">{ch.label}</span>
                    {ch.isPrimary && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold/10 text-gold font-medium">Primary</span>
                    )}
                    {!ch.isEnabled && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 font-medium">Off</span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-500 truncate">{ch.value}</p>
                </div>
                {ch.url && (
                  <a href={ch.url} target="_blank" rel="noopener noreferrer"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
                    title={ch.url}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openChannelEdit(ch)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
                    title="Редактировать"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleChannelDelete(ch.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-900/20"
                    title="Удалить"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
