'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, ChevronRight, ChevronDown, Plus } from 'lucide-react'
import { saveNavigationItem, deleteNavigationItem, toggleNavigationItem, reorderNavigationItems } from '@/lib/actions/navigation'

interface NavItemData {
  id: string
  location: string
  parentId: string | null
  href: string | null
  labelRu: string | null
  labelUk: string | null
  isEnabled: boolean
  sortOrder: number
}

interface FlatNode extends NavItemData {
  depth: number
}

interface Props {
  items: NavItemData[]
}

const LOCATIONS = ['HEADER', 'FOOTER', 'MOBILE'] as const

/* ── Sortable item ── */

function TreeItem({ node, collapsed, onToggle, onEdit }: { node: FlatNode; collapsed: boolean; onToggle: () => void; onEdit: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: node.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    ...(isDragging ? { zIndex: 10 } : {}),
  }

  const hasCollapse = node.depth < 2

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${
        isDragging ? 'border-amber-500/40 bg-zinc-800 shadow-lg' : 'border-zinc-800 bg-zinc-900/60'
      } ${node.isEnabled ? '' : 'opacity-50'}`}
    >
      {node.depth > 0 && <div style={{ width: node.depth * 24 }} />}

      {hasCollapse ? (
        <button onClick={onToggle} className="flex items-center justify-center rounded p-0.5 text-zinc-600 hover:text-zinc-300">
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      ) : (
        <div className="w-4" />
      )}

      <button
        {...attributes}
        {...listeners}
        className="flex cursor-grab touch-none items-center justify-center rounded-md p-1 text-zinc-600 opacity-0 transition-opacity hover:bg-zinc-800 group-hover:opacity-100 active:cursor-grabbing"
        aria-label="Перетягнути"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">{node.location}</span>
      <span className="font-medium text-zinc-200">{node.labelRu || node.labelUk || '(без назви)'}</span>
      {node.href && <span className="text-xs text-zinc-600">{node.href}</span>}
      {!node.isEnabled && <span className="text-xs text-red-500">вимкнено</span>}

      <div className="flex-1" />

      <button onClick={() => toggleNavigationItem(node.id)} className="rounded px-1.5 py-0.5 text-xs text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300">
        {node.isEnabled ? 'Вимк' : 'Увімк'}
      </button>
      <button onClick={onEdit} className="rounded px-1.5 py-0.5 text-xs text-amber-400 hover:bg-zinc-800">
        Ред
      </button>
      <form
        action={deleteNavigationItem.bind(null, node.id)}
        onSubmit={(e) => { if (!confirm('Видалити пункт і всі дочірні?')) e.preventDefault() }}
        className="inline"
      >
        <button type="submit" className="rounded px-1.5 py-0.5 text-xs text-red-500 hover:bg-zinc-800">Дел</button>
      </form>
    </div>
  )
}

/* ── Edit form ── */

function EditForm({ item, items, onCancel }: { item?: NavItemData; items: NavItemData[]; onCancel: () => void }) {
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    try {
      const form = new FormData(e.currentTarget)
      await saveNavigationItem(form)
      onCancel()
    } catch {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 rounded-lg border border-zinc-700 bg-zinc-800/60 p-3">
      {item && <input type="hidden" name="id" value={item.id} />}
      <select name="location" defaultValue={item?.location ?? 'HEADER'} className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-200">
        {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
      </select>
      <select name="parentId" defaultValue={item?.parentId ?? ''} className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-200">
        <option value="">(корінь)</option>
        {items.filter((i) => i.id !== item?.id).map((i) => (
          <option key={i.id} value={i.id}>{i.labelRu || i.labelUk || i.id}</option>
        ))}
      </select>
      <input name="href" defaultValue={item?.href ?? ''} className="w-36 rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-200 placeholder-zinc-600" placeholder="/page" />
      <input name="labelRu" defaultValue={item?.labelRu ?? ''} className="w-32 rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-200 placeholder-zinc-600" placeholder="Назва (RU)" />
      <input name="labelUk" defaultValue={item?.labelUk ?? ''} className="w-32 rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-200 placeholder-zinc-600" placeholder="Назва (UK)" />
      <label className="flex items-center gap-1 text-xs text-zinc-400">
        <input type="checkbox" name="isEnabled" defaultChecked={item?.isEnabled ?? true} className="rounded" /> Вкл
      </label>
      <div className="flex gap-1">
        <button type="submit" disabled={pending} className="rounded bg-amber-600 px-3 py-1.5 text-sm text-white hover:bg-amber-700 disabled:opacity-50">
          {pending ? '...' : 'Збр'}
        </button>
        <button type="button" onClick={onCancel} disabled={pending} className="rounded border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800">
          X
        </button>
      </div>
    </form>
  )
}

/* ── Restore parents from flat list ── */

function restoreParents(flat: FlatNode[]): NavItemData[] {
  const stack: { id: string; depth: number }[] = []
  const result: NavItemData[] = []
  for (const node of flat) {
    while (stack.length > 0 && stack[stack.length - 1].depth >= node.depth) stack.pop()
    const parentId = stack.length > 0 ? stack[stack.length - 1].id : null
    result.push({ ...node, parentId, sortOrder: result.length })
    stack.push({ id: node.id, depth: node.depth })
  }
  return result
}

/* ── Flatten tree ── */

function flattenTree(items: NavItemData[], collapsed: Set<string>, parentId: string | null = null, depth = 0): FlatNode[] {
  const result: FlatNode[] = []
  const children = items.filter((i) => i.parentId === parentId).sort((a, b) => a.sortOrder - b.sortOrder)
  for (const item of children) {
    result.push({ ...item, depth })
    if (!collapsed.has(item.id)) {
      const g = flattenTree(items, collapsed, item.id, depth + 1)
      if (g.length > 0) result.push(...g)
    }
  }
  return result
}

/* ── Main component ── */

export function NavTreeSortable({ items }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<string | null>(null)
  const [flatItems, setFlatItems] = useState<FlatNode[]>(() => flattenTree(items, collapsed))
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function toggleCollapse(id: string) {
    setCollapsed((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }

  const visibleItems = useMemo(() => flattenTree(items, collapsed), [items, collapsed])
  if (flatItems !== visibleItems && !saving) setFlatItems(visibleItems)

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = flatItems.findIndex((i) => i.id === active.id)
    const newIndex = flatItems.findIndex((i) => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = arrayMove(flatItems, oldIndex, newIndex)
    setFlatItems(reordered)
    setSaving(true)
    try {
      const restored = restoreParents(reordered)
      await reorderNavigationItems(restored.map((i) => ({ id: i.id, parentId: i.parentId, sortOrder: i.sortOrder })))
    } catch { setFlatItems(visibleItems) }
    finally { setSaving(false) }
  }, [flatItems, visibleItems])

  return (
    <div className={`space-y-2 ${saving ? 'pointer-events-none opacity-60' : ''}`}>
      {LOCATIONS.map((loc) => {
        const locItems = flatItems.filter((i) => i.location === loc)
        return (
          <div key={loc} className="mb-6">
            <h3 className="mb-2 text-sm font-semibold uppercase text-zinc-500">{loc}</h3>
            {locItems.length === 0 && editing !== `new-${loc}` && (
              <p className="mb-2 text-sm text-zinc-600">Поки пусто</p>
            )}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={locItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-1">
                  {locItems.map((node) => (
                    <div key={node.id}>
                      {editing === node.id ? (
                        <div className="mb-1 ml-4">
                          <EditForm item={items.find((i) => i.id === node.id)} items={items} onCancel={() => setEditing(null)} />
                        </div>
                      ) : (
                        <div className="group">
                          <TreeItem node={node} collapsed={collapsed.has(node.id)} onToggle={() => toggleCollapse(node.id)} onEdit={() => setEditing(node.id)} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            {editing === `new-${loc}` ? (
              <div className="mt-2">
                <EditForm items={items} onCancel={() => setEditing(null)} />
              </div>
            ) : (
              <button onClick={() => setEditing(`new-${loc}`)} className="mt-2 flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300">
                <Plus className="h-3.5 w-3.5" /> Додати пункт
              </button>
            )}
          </div>
        )
      })}
      {saving && (
        <div className="flex items-center justify-center rounded-lg bg-zinc-900/30 py-2">
          <span className="text-xs text-zinc-400">Збереження...</span>
        </div>
      )}
    </div>
  )
}
