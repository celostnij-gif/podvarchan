'use client'

import { useTransition, useMemo, useState, useCallback } from 'react'
import { addSection, deleteSection, toggleSection, updateSectionContent, reorderSections } from '@/lib/actions/pages'
import type { PageSectionWithTranslations } from '../types'
import { BlockEditorPanel } from '@/components/admin/BlockEditorPanel'
import { BlockLibraryDialog } from '@/components/admin/BlockLibraryDialog'
import { getBlockDefinition, getAllBlockDefinitions, parseBlockContent } from '@/lib/blocks/registry'
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
import { useRouter } from 'next/navigation'

interface SectionEditorProps {
  pageId: string
  sections: PageSectionWithTranslations[]
}

function SectionEditorItem({ section, pageId, onRefresh }: {
  section: PageSectionWithTranslations
  pageId: string
  onRefresh: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.section.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: 'relative',
    ...(isDragging ? { zIndex: 10 } : {}),
  }

  const ru = section.translations.find((t) => t.locale === 'ru')
  const uk = section.translations.find((t) => t.locale === 'uk')

  // Parse contentJson once, using registry's parseBlockContent with defaults
  const blockContent = useMemo(() => ({
    ru: parseBlockContent(section.section.type, ru?.contentJson),
    uk: parseBlockContent(section.section.type, uk?.contentJson),
  }), [section.section.type, ru?.contentJson, uk?.contentJson])

  const handleContentSave = (locale: 'ru' | 'uk', contentJson: string) => {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('locale', locale)
      fd.set('content_json', contentJson)
      fd.set('page_id', pageId)
      try {
        await updateSectionContent(section.section.id, fd)
      } catch {
        // ignore
      }
    })
  }

  const handleDelete = () => {
    if (!confirm('Видалити секцію?')) return
    startTransition(async () => {
      try {
        await deleteSection(section.section.id)
        onRefresh()
      } catch {
        // ignore
      }
    })
  }

  const handleToggle = () => {
    startTransition(async () => {
      try {
        await toggleSection(section.section.id, !section.section.enabled)
        onRefresh()
      } catch {
        // ignore
      }
    })
  }

  const def = getBlockDefinition(section.section.type)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-lg border p-4 transition-all ${
        isDragging
          ? 'border-amber-500/40 bg-zinc-800 shadow-lg ring-1 ring-amber-500/20'
          : section.section.enabled
            ? 'border-zinc-700/50 bg-zinc-900/40'
            : 'border-dashed border-zinc-700/30 bg-zinc-900/20'
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="flex cursor-grab touch-none items-center justify-center rounded-md p-1 text-zinc-600 opacity-0 transition-opacity hover:bg-zinc-800 group-hover:opacity-100 active:cursor-grabbing"
            aria-label="Перетягнути"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleToggle}
            disabled={isPending}
            className={`rounded px-2 py-0.5 text-xs font-medium ${
              section.section.enabled
                ? 'bg-green-900/30 text-green-400'
                : 'bg-zinc-800 text-zinc-500'
            }`}
          >
            {section.section.enabled ? 'Увімк' : 'Вимк'}
          </button>
          <span className="text-sm font-medium text-zinc-200">
            {def?.icon ?? '🧩'} {def?.label ?? section.section.type}
          </span>
          <span className="text-xs text-zinc-500">key: {section.section.key}</span>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
        >
          Видалити
        </button>
      </div>

      <BlockEditorPanel
        sectionType={section.section.type}
        sectionKey={section.section.key}
        content={blockContent}
        onSave={handleContentSave}
        isPending={isPending}
      />
    </div>
  )
}



export function SectionEditor({ pageId, sections }: SectionEditorProps) {
  const [isPending, startTransition] = useTransition()
  const [showLibrary, setShowLibrary] = useState(false)
  const [sectionOrder, setSectionOrder] = useState<string[] | null>(null)
  const [savingOrder, setSavingOrder] = useState(false)
  const router = useRouter()
  const [addError, setAddError] = useState<string | null>(null)

  const refresh = useCallback(() => {
    router.refresh()
  }, [router])

  const blockDefs = getAllBlockDefinitions()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // Current section order (either from drag state or from props)
  const order = sectionOrder ?? sections.map((s) => s.section.id)
  // Stable reference for SortableContext
  const stableSections = useMemo(() =>
    order.map((id) => sections.find((s) => s.section.id === id)!).filter(Boolean),
    [order, sections],
  )

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = order.indexOf(String(active.id))
    const newIndex = order.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return

    const newOrder = arrayMove(order, oldIndex, newIndex)
    setSectionOrder(newOrder)

    setSavingOrder(true)
    try {
      await reorderSections(pageId, newOrder)
    } catch {
      setSectionOrder(null)
    } finally {
      setSavingOrder(false)
    }
  }, [order, pageId])

  const handleAddSection = (formData: FormData) => {
    startTransition(async () => {
      setAddError(null)
      try {
        await addSection(pageId, formData)
        refresh()
      } catch (err) {
        setAddError(err instanceof Error ? err.message : 'Невідома помилка')
      }
    })
  }

  const handleInsertTemplate = (tpl: { sectionType: string; contentRu: string; contentUk: string }) => {
    const key = `${tpl.sectionType}-${Date.now()}`
    const fd = new FormData()
    fd.set('type', tpl.sectionType)
    fd.set('key', key)
    fd.set('settings_json', '{}')
    fd.set('ru_contentJson', tpl.contentRu)
    fd.set('uk_contentJson', tpl.contentUk)
    handleAddSection(fd)
  }

  return (
    <div className={`space-y-4 ${savingOrder ? 'pointer-events-none opacity-60' : ''}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Секції сторінки</h2>
        {sections.length > 0 && (
          <span className="text-xs text-zinc-600">
            {sections.length} {sections.length === 1 ? 'секція' : 'секцій'}
            {savingOrder && ' · зберігаємо…'}
          </span>
        )}
      </div>

      {sections.length === 0 && (
        <p className="text-sm text-zinc-500">Секцій ще немає</p>
      )}

      {sections.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={order} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {stableSections.map((sec) => (
                <SectionEditorItem
                  key={sec.section.id}
                  section={sec}
                  pageId={pageId}
                  onRefresh={refresh}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add section form */}
      <div className="rounded-lg border border-dashed border-zinc-700/50 bg-zinc-900/20 p-4">
        <form action={handleAddSection} className="flex items-end gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Тип секції</label>
            <select
              name="type"
              required
              className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            >
              {blockDefs.map((b) => (
                <option key={b.type} value={b.type}>
                  {b.icon} {b.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Ключ (унікальний)</label>
            <input
              name="key"
              required
              placeholder="main-hero"
              className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            />
          </div>
          <input type="hidden" name="settings_json" value="{}" />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
          >
            + Додати
          </button>
        </form>
        {addError && <p className="text-sm text-red-400 mt-2">{addError}</p>}

        {/* Divider */}
        <div className="relative mb-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-zinc-900/20 px-2 text-xs text-zinc-600">або</span>
          </div>
        </div>

        {/* From template button */}
        <button
          type="button"
          onClick={() => setShowLibrary(true)}
          className="w-full rounded-lg border border-dashed border-zinc-700/30 py-2.5 text-sm text-zinc-500 hover:border-zinc-600 hover:text-zinc-400 transition-colors flex items-center justify-center gap-2"
        >
          📚 З шаблону
        </button>
      </div>

      {/* Block Library Dialog */}
      <BlockLibraryDialog
        open={showLibrary}
        onClose={() => setShowLibrary(false)}
        onSelectTemplate={handleInsertTemplate}
      />
    </div>
  )
}
