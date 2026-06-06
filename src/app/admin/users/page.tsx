'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, X, Shield, ShieldOff, Circle } from 'lucide-react'
import { getUsers, createUser, updateUser, deleteUser } from '@/lib/actions/users'
import type { User } from '@/db/schema'

/* ── Toast ── */

function Toast({ toast, onClose }: { toast: { type: 'success' | 'error'; message: string } | null; onClose: () => void }) {
  if (!toast) return null
  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
      toast.type === 'success'
        ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-700/50'
        : 'bg-red-900/80 text-red-200 border border-red-700/50'
    }`}>
      {toast.message}
      <button onClick={onClose} className="ml-3 opacity-60 hover:opacity-100">&times;</button>
    </div>
  )
}

/* ── Role colors ── */

const ROLE_BADGES: Record<string, string> = {
  OWNER: 'bg-amber-900/30 text-amber-400 border-amber-700/30',
  ADMIN: 'bg-blue-900/30 text-blue-400 border-blue-700/30',
  EDITOR: 'bg-emerald-900/30 text-emerald-400 border-emerald-700/30',
  VIEWER: 'bg-zinc-800/50 text-zinc-400 border-zinc-700/30',
}

/* ── User form ── */

const EMPTY_FORM = { email: '', password: '', name: '', role: 'VIEWER' as 'VIEWER' | 'EDITOR' | 'ADMIN' | 'OWNER' }

/* ── Component ── */

export default function UsersPage() {
  const [users, setUsers] = useState<Array<Omit<User, 'passwordHash'>>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const reload = useCallback(async () => {
    setError('')
    const result = await getUsers()
    if ('data' in result) {
      setUsers(result.data!)
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

  /* ── Form handlers ── */

  function openCreate() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(user: Omit<User, 'passwordHash'>) {
    setEditId(user.id)
    setForm({ email: user.email, password: '', name: user.name ?? '', role: user.role as 'VIEWER' | 'EDITOR' | 'ADMIN' | 'OWNER' })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.email || !form.name) {
      showToast('error', 'Заполните email и имя')
      return
    }
    if (!editId && !form.password) {
      showToast('error', 'Пароль обязателен при создании')
      return
    }
    setSaving(true)
    const data = editId
      ? { email: form.email, name: form.name, role: form.role, ...(form.password ? { password: form.password } : {}) }
      : form
    const result = editId ? await updateUser(editId, data) : await createUser(data)
    if ('data' in result) {
      showToast('success', editId ? 'Пользователь обновлён' : 'Пользователь создан')
      setShowForm(false)
      setEditId(null)
      reload()
    } else {
      showToast('error', result.error ?? 'Ошибка сохранения')
    }
    setSaving(false)
  }

  async function handleToggleActive(user: Omit<User, 'passwordHash'>) {
    const result = await updateUser(user.id, { isActive: !user.isActive })
    if ('data' in result) {
      showToast('success', user.isActive ? 'Пользователь деактивирован' : 'Пользователь активирован')
      reload()
    } else {
      showToast('error', result.error ?? 'Ошибка')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить этого пользователя?')) return
    const result = await deleteUser(id)
    if ('data' in result) {
      showToast('success', 'Пользователь удалён')
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
    <div className="space-y-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Пользователи</h1>
          <p className="text-sm text-zinc-500 mt-1">Управление учётными записями администраторов</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold/10 text-gold hover:bg-gold/20 border border-gold/20 transition-all text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Добавить
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl p-6 mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-zinc-100">
                {editId ? 'Редактировать пользователя' : 'Новый пользователь'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditId(null) }}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
              ><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:border-gold/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Имя *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:border-gold/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Пароль {editId ? '(оставьте пустым чтобы не менять)' : '*'}
                </label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:border-gold/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Роль</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as never }))}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:border-gold/50"
                >
                  <option value="VIEWER">VIEWER — только просмотр</option>
                  <option value="EDITOR">EDITOR — редактор</option>
                  <option value="ADMIN">ADMIN — администратор</option>
                  <option value="OWNER">OWNER — владелец</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
              <button onClick={() => { setShowForm(false); setEditId(null) }}
                className="px-4 py-2 rounded-xl text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              >Отмена</button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2 rounded-xl bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 text-sm font-medium disabled:opacity-50"
              >
                {saving ? 'Сохранение...' : editId ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="text-center py-12">
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={() => reload()} className="mt-3 text-gold text-sm hover:underline">Повторить</button>
        </div>
      )}

      {/* Table */}
      {!error && users.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3 px-4 text-zinc-500 font-medium">Пользователь</th>
                <th className="text-left py-3 px-4 text-zinc-500 font-medium hidden md:table-cell">Email</th>
                <th className="text-left py-3 px-4 text-zinc-500 font-medium hidden sm:table-cell">Роль</th>
                <th className="text-left py-3 px-4 text-zinc-500 font-medium hidden lg:table-cell">Статус</th>
                <th className="text-left py-3 px-4 text-zinc-500 font-medium hidden lg:table-cell">Последний вход</th>
                <th className="text-right py-3 px-4 text-zinc-500 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gold/10 flex items-center justify-center text-xs font-bold text-gold">
                        {user.name?.charAt(0)?.toUpperCase() ?? '?'}
                      </div>
                      <div>
                        <p className="text-zinc-200 font-medium">{user.name}</p>
                        <p className="text-xs text-zinc-600 md:hidden">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-zinc-400 hidden md:table-cell">{user.email}</td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${ROLE_BADGES[user.role] ?? ''}`}>
                      <Circle className="w-2 h-2" />
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 hidden lg:table-cell">
                    <span className={`inline-flex items-center gap-1.5 text-xs ${user.isActive ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                      {user.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-zinc-600 hidden lg:table-cell">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('ru-RU') : '—'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleToggleActive(user)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
                        title={user.isActive ? 'Деактивировать' : 'Активировать'}
                      >
                        {user.isActive ? <Shield className="w-3.5 h-3.5" /> : <ShieldOff className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => openEdit(user)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
                        title="Редактировать"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(user.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-900/20 transition-all"
                        title="Удалить"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {!error && users.length === 0 && (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl">
          <p className="text-zinc-600 text-sm mb-3">Нет пользователей</p>
          <button onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold/10 text-gold hover:bg-gold/20 border border-gold/20 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            Добавить первого пользователя
          </button>
        </div>
      )}
    </div>
  )
}
