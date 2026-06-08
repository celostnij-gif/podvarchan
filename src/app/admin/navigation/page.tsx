'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, X, Power, PowerOff } from 'lucide-react'
import { getNavigationItems, createNavItem, updateNavItem, deleteNavItem } from '@/lib/actions/navigation'
import type { NavigationItem } from '@/db/schema'

/* ── Types ── */

interface NavItemWithChildren extends NavigationItem {
  children: NavItemWithChildren[]
}

type LocationType = 'HEADER' | 'FOOTER' | 'MOBILE'

const LOCATIONS: LocationType[] = ['HEADER', 'FOOTER', 'MOBILE']
const LOCATION_LABELS: Record<LocationType, string> = {
  HEADER: 'Шапка (Header)',
  FOOTER: 'Подвал (Footer)',
  MOBILE: 'Мобильное меню',
}

/* ── Empty form state ── */

const EMPTY_FORM = {
  location: 'HEADER' as LocationType,
  parentId: '',
  href: '/',
  labelRu: '',
  labelUk: '',
  isEnabled: true,
  sortOrder: 0,
}

/* ── Helpers ── */

function buildTree(items: NavigationItem[]): NavItemWithChildren[] {
  const topLevel = items.filter(i => !i.parentId)
  return topLevel.map(item => ({
    ...item,
    children: items
      .filter(child => child.parentId === item.id)
      .map(child => ({ ...child, children: [] })),
  }))
}

/* ── Component ── */

export default function NavigationPage() {
  const [items, setItems] = useState<NavigationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [activeLocation, setActiveLocation] = useState<LocationType>('HEADER')

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const reload = useCallback(async () => {
    setError('')
    const result = await getNavigationItems()
    if ('data' in result) {
      setItems(result.data!)
    } else {
      setError(result.error ?? 'Ошибка загрузки')
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true)
      reload().then(() => setLoading(false))
    }, 0)
    return () => clearTimeout(timer)
  }, [reload])

  const filteredItems = buildTree(items.filter(i => i.location === activeLocation))

  /* ── Form handlers ── */

  function openCreate() {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, location: activeLocation })
    setShowForm(true)
  }

  function openEdit(item: NavigationItem) {
    setEditingId(item.id)
    setForm({
      location: item.location as LocationType,
      parentId: item.parentId ?? '',
      href: item.href,
      labelRu: item.labelRu,
      labelUk: item.labelUk,
      isEnabled: item.isEnabled,
      sortOrder: item.sortOrder,
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.href || !form.labelRu || !form.labelUk) {
      showToast('error', 'Заполните обязательные поля: href, labelRu, labelUk')
      return
    }
    setSaving(true)
    const data = {
      location: form.location,
      parentId: form.parentId || undefined,
      href: form.href,
      labelRu: form.labelRu,
      labelUk: form.labelUk,
      isEnabled: form.isEnabled,
      sortOrder: form.sortOrder,
    }
    const result = editingId
      ? await updateNavItem(editingId, data)
      : await createNavItem(data)
    if ('data' in result) {
      showToast('success', editingId ? 'Пункт обновлён' : 'Пункт добавлен')
      setShowForm(false)
      setEditingId(null)
      reload()
    } else {
      showToast('error', result.error ?? 'Ошибка сохранения')
    }
    setSaving(false)
  }

  async function handleToggle(item: NavigationItem) {
    const result = await updateNavItem(item.id, { isEnabled: !item.isEnabled })
    if ('data' in result) {
      showToast('success', item.isEnabled ? 'Пункт отключён' : 'Пункт включён')
      reload()
    } else {
      showToast('error', result.error ?? 'Ошибка')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить этот пункт навигации?')) return
    const result = await deleteNavItem(id)
    if ('data' in result) {
      showToast('success', 'Пункт удалён')
      reload()
    } else {
      showToast('error', result.error ?? 'Ошибка удаления')
    }
  }

  /* ── Render ── */

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all duration-300 ${
          toast.type === 'success' ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-700/50' : 'bg-red-900/80 text-red-200 border border-red-700/50'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Навигация</h1>
          <p className="text-sm text-zinc-500 mt-1">Управление пунктами меню в шапке, подвале и мобильной версии</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold/10 text-gold hover:bg-gold/20 border border-gold/20 transition-all duration-200 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Добавить пункт
        </button>
      </div>

      {/* Location tabs */}
      <div className="flex gap-1 border-b border-zinc-800">
        {LOCATIONS.map(loc => (
          <button
            key={loc}
            onClick={() => setActiveLocation(loc)}
            className={`px-4 py-2.5 text-sm font-medium transition-all duration-200 border-b-2 -mb-px ${
              activeLocation === loc
                ? 'text-gold border-gold'
                : 'text-zinc-500 border-transparent hover:text-zinc-300'
            }`}
          >
            {LOCATION_LABELS[loc]}
            <span className="ml-2 text-xs text-zinc-600">
              {items.filter(i => i.location === loc).length}
            </span>
          </button>
        ))}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl p-6 mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-zinc-100">
                {editingId ? 'Редактировать пункт' : 'Новый пункт навигации'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditingId(null) }}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Расположение</label>
                  <select value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value as LocationType }))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:border-gold/50"
                  >
                    {LOCATIONS.map(loc => (
                      <option key={loc} value={loc}>{LOCATION_LABELS[loc]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Родительский ID</label>
                  <input value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
                    placeholder="ID родителя (опционально)"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:border-gold/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">HREF *</label>
                <input value={form.href} onChange={e => setForm(f => ({ ...f, href: e.target.value }))}
                  placeholder="/uslugi/"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:border-gold/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Label (RU) *</label>
                  <input value={form.labelRu} onChange={e => setForm(f => ({ ...f, labelRu: e.target.value }))}
                    placeholder="Услуги"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:border-gold/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Label (UK) *</label>
                  <input value={form.labelUk} onChange={e => setForm(f => ({ ...f, labelUk: e.target.value }))}
                    placeholder="Послуги"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:border-gold/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Сортировка</label>
                <input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:border-gold/50"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isEnabled}
                  onChange={e => setForm(f => ({ ...f, isEnabled: e.target.checked }))}
                  className="w-4 h-4 rounded bg-zinc-800 border-zinc-600 text-gold focus:ring-gold/30"
                />
                <span className="text-sm text-zinc-300">Включено</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
              <button onClick={() => { setShowForm(false); setEditingId(null) }}
                className="px-4 py-2 rounded-xl text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all duration-200"
              >
                Отмена
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2 rounded-xl bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 text-sm font-medium transition-all duration-200 disabled:opacity-50"
              >
                {saving ? 'Сохранение...' : editingId ? 'Сохранить' : 'Добавить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={reload} className="mt-3 text-gold text-sm hover:underline">Повторить</button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-zinc-600 text-sm mb-3">Нет пунктов навигации для {LOCATION_LABELS[activeLocation].toLowerCase()}</p>
          <button onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold/10 text-gold hover:bg-gold/20 border border-gold/20 transition-all duration-200 text-sm"
          >
            <Plus className="w-4 h-4" />
            Добавить первый пункт
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <div key={item.id}>
              {/* Parent row */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700/50 transition-all duration-200 group">
                <button onClick={() => handleToggle(item)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    item.isEnabled ? 'bg-emerald-900/30 text-emerald-400' : 'bg-zinc-800/50 text-zinc-600'
                  }`}
                  title={item.isEnabled ? 'Отключить' : 'Включить'}
                >
                  {item.isEnabled ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-200 truncate">{item.labelRu}</span>
                    <span className="text-xs text-zinc-600">/ {item.labelUk}</span>
                  </div>
                  <p className="text-xs text-zinc-600 font-mono truncate">{item.href}</p>
                </div>
                <span className="text-[10px] text-zinc-700 font-mono hidden sm:inline">{item.sortOrder}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button onClick={() => openEdit(item)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all duration-200"
                    title="Редактировать"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(item.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-900/20 transition-all duration-200"
                    title="Удалить"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Children */}
              {item.children.length > 0 && (
                <div className="ml-6 mt-1 space-y-1 border-l-2 border-zinc-800 pl-3">
                  {item.children.map((child) => (
                    <div key={child.id}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-zinc-900/30 border border-zinc-800/30 hover:border-zinc-700/50 transition-all duration-200 group"
                    >
                      <button onClick={() => handleToggle(child)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 ${
                          child.isEnabled ? 'bg-emerald-900/30 text-emerald-400' : 'bg-zinc-800/50 text-zinc-600'
                        }`}
                        title={child.isEnabled ? 'Отключить' : 'Включить'}
                      >
                        {child.isEnabled ? <Power className="w-3 h-3" /> : <PowerOff className="w-3 h-3" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-zinc-300 truncate">{child.labelRu}</span>
                          <span className="text-xs text-zinc-600">/ {child.labelUk}</span>
                        </div>
                        <p className="text-xs text-zinc-600 font-mono truncate">{child.href}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button onClick={() => openEdit(child)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all duration-200"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={() => handleDelete(child.id)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-900/20 transition-all duration-200"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
