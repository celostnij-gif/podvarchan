'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

interface Props {
  entityTypes: string[]
  actions: string[]
}

export function AuditFilters({ entityTypes, actions }: Props) {
  const router = useRouter()
  const sp = useSearchParams()
  const [entityType, setEntityType] = useState(sp.get('entityType') ?? '')
  const [action, setAction] = useState(sp.get('action') ?? '')

  function apply() {
    const params = new URLSearchParams()
    if (entityType) params.set('entityType', entityType)
    if (action) params.set('action', action)
    router.push(`/admin/audit?${params.toString()}`)
  }

  function reset() {
    setEntityType('')
    setAction('')
    router.push('/admin/audit')
  }

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div>
        <label htmlFor="entityType" className="block text-xs text-zinc-500 mb-1">Тип сутності</label>
        <select id="entityType" value={entityType} onChange={(e) => setEntityType(e.target.value)} className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200">
          <option value="">Всі</option>
          {entityTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="action" className="block text-xs text-zinc-500 mb-1">Дія</label>
        <select id="action" value={action} onChange={(e) => setAction(e.target.value)} className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200">
          <option value="">Всі</option>
          {actions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <button onClick={apply} className="bg-amber-600 text-white px-4 py-1.5 rounded text-sm hover:bg-amber-500">
        Застосувати
      </button>
      <button onClick={reset} className="px-4 py-1.5 rounded text-sm border border-zinc-700 text-zinc-400 hover:bg-zinc-800">
        Скинути
      </button>
    </div>
  )
}
