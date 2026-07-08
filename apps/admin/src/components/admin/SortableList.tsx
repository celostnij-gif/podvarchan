'use client'

import { useState, useCallback } from 'react'
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
import { GripVertical } from 'lucide-react'

/* ── Sortable item wrapper ── */

interface SortableItemProps {
  id: string
  children: React.ReactNode
}

function SortableItem({ id, children }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      position: 'relative',
      ...(isDragging ? { zIndex: 10 } : {}),
    }

  return (
    <div ref={setNodeRef} style={style} className={`group flex items-center gap-2 ${isDragging ? 'shadow-lg' : ''}`}>
      <button
        {...attributes}
        {...listeners}
        className="flex cursor-grab touch-none items-center justify-center rounded-md p-1 text-zinc-600 opacity-0 transition-opacity hover:bg-zinc-800 group-hover:opacity-100 active:cursor-grabbing"
        aria-label="Перетягнути"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

/* ── Sortable list ── */

interface SortableListProps<T extends { id: string }> {
  items: T[]
  onReorder: (orderedIds: string[]) => Promise<void>
  children: (item: T, index: number) => React.ReactNode
}

export function SortableList<T extends { id: string }>({ items: initialItems, onReorder, children }: SortableListProps<T>) {
  const [items, setItems] = useState(initialItems)
  const [loading, setLoading] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(items, oldIndex, newIndex)
    setItems(reordered)
    setLoading(true)
    try {
      await onReorder(reordered.map((i) => i.id))
    } catch {
      setItems(initialItems)
    } finally {
      setLoading(false)
    }
  }, [items, onReorder, initialItems])

  return (
    <div className={`relative ${loading ? 'pointer-events-none opacity-60' : ''}`}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {items.map((item, index) => (
              <SortableItem key={item.id} id={item.id}>
                {children(item, index)}
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-zinc-900/30">
          <span className="text-xs text-zinc-400">Збереження...</span>
        </div>
      )}
    </div>
  )
}
