'use client'

import { useState } from 'react'
import { saveNavigationItem, deleteNavigationItem, toggleNavigationItem } from '@/lib/actions/navigation'
import type { InferSelectModel } from 'drizzle-orm'
import type { navigationItems as navSchema } from '@/db/schema/settings'

type NavItem = InferSelectModel<typeof navSchema>

interface Props {
  items: NavItem[]
}

const LOCATIONS = ['HEADER', 'FOOTER', 'MOBILE'] as const

export function NavigationTree({ items }: Props) {
  const [editing, setEditing] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const rootItems = items.filter((i) => !i.parentId)
  const childrenOf = (parentId: string) => items.filter((i) => i.parentId === parentId)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      const form = new FormData(e.currentTarget)
      await saveNavigationItem(form)
      setEditing(null)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Видалити пункт і всі дочірні?')) return
    await deleteNavigationItem(id)
  }

  function renderForm(item?: NavItem) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-end">
        {item && <input type="hidden" name="id" value={item.id} />}
        <select name="location" defaultValue={item?.location ?? 'HEADER'} className="border rounded px-2 py-1 text-sm">
          {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <select name="parentId" defaultValue={item?.parentId ?? ''} className="border rounded px-2 py-1 text-sm">
          <option value="">(корінь)</option>
          {items.filter((i) => i.id !== item?.id && !item?.parentId?.startsWith(i.id)).map((i) => (
            <option key={i.id} value={i.id}>{i.labelRu || i.labelUk || i.id}</option>
          ))}
        </select>
        <input name="href" defaultValue={item?.href ?? ''} className="border rounded px-2 py-1 text-sm w-48" placeholder="/page" />
        <input name="labelRu" defaultValue={item?.labelRu ?? ''} className="border rounded px-2 py-1 text-sm w-36" placeholder="Назва (RU)" />
        <input name="labelUk" defaultValue={item?.labelUk ?? ''} className="border rounded px-2 py-1 text-sm w-36" placeholder="Назва (UK)" />
        <label className="flex items-center gap-1 text-xs">
          <input type="checkbox" name="isEnabled" defaultChecked={item?.isEnabled ?? true} /> Вкл
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

  function renderTree(items: NavItem[], depth = 0) {
    return items.map((item) => {
      const children = childrenOf(item.id)
      const isEditing = editing === item.id

      return (
        <div key={item.id}>
          {isEditing ? (
            <div className="p-3 border rounded bg-gray-50 mb-1" style={{ marginLeft: depth * 24 }}>
              {renderForm(item)}
            </div>
          ) : (
            <div
              className={`flex items-center gap-2 p-2 border rounded mb-1 ${item.isEnabled ? '' : 'opacity-50'}`}
              style={{ marginLeft: depth * 24 }}
            >
              <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded">{item.location}</span>
              <span className="font-medium text-sm">{item.labelRu || item.labelUk || '(без назви)'}</span>
              {item.href && <span className="text-xs text-gray-500">{item.href}</span>}
              {!item.isEnabled && <span className="text-xs text-red-500">вимкнено</span>}
              <div className="flex-1" />
              <button onClick={() => toggleNavigationItem(item.id)} className="text-xs text-gray-500 hover:text-gray-700">
                {item.isEnabled ? 'Вимк' : 'Увімк'}
              </button>
              <button onClick={() => setEditing(item.id)} className="text-blue-600 hover:underline text-sm">Ред</button>
              <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline text-sm">Дел</button>
            </div>
          )}
          {children.length > 0 && renderTree(children, depth + 1)}
        </div>
      )
    })
  }

  return (
    <div className="space-y-2">
      {LOCATIONS.map((loc) => {
        const locationItems = rootItems.filter((i) => i.location === loc)
        return (
          <div key={loc} className="mb-6">
            <h3 className="font-semibold text-sm text-gray-700 mb-2 uppercase">{loc}</h3>
            {locationItems.length === 0 && !editing?.startsWith('new-') && (
              <p className="text-sm text-gray-400">Поки пусто</p>
            )}
            {renderTree(locationItems)}
          </div>
        )
      })}
      {!editing && (
        <button
          onClick={() => setEditing('__new__')}
          className="text-green-600 hover:underline text-sm"
        >
          + Додати пункт
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
