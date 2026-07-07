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
        <label className="block text-xs text-gray-500 mb-1">Тип сутності</label>
        <select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="border rounded px-2 py-1 text-sm">
          <option value="">Всі</option>
          {entityTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Дія</label>
        <select value={action} onChange={(e) => setAction(e.target.value)} className="border rounded px-2 py-1 text-sm">
          <option value="">Всі</option>
          {actions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <button onClick={apply} className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700">
        Застосувати
      </button>
      <button onClick={reset} className="px-4 py-1.5 rounded text-sm border hover:bg-gray-100">
        Скинути
      </button>
    </div>
  )
}
