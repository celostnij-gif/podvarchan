'use client'

import { useMemo, useState, useCallback } from 'react'
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
import { GripVertical, Trash2, EyeOff, Eye, Loader2 } from 'lucide-react'

interface SectionEditorProps {
  pageId: string
  sections: PageSectionWithTranslations[]
}

function SectionEditorItem({
  section,
  pageId,
  onUpdate,
  onDelete,
  onToggle,
}: {
  section: PageSectionWithTranslations
  pageId: string
  onUpdate: (id: string, locale: 'ru' | 'uk', contentJson: string) => void
  onDelete: (id: string) => void
  onToggle: (id: string, enabled: boolean) => void
}) {
  const [saving, setSaving] = useState(false)

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
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
  }

  const ru = section.translations.find((t) => t.locale === 'ru')
  const uk = section.translations.find((t) => t.locale === 'uk')

  // Parse contentJson once, using registry's parseBlockContent with defaults
  const blockContent = useMemo(() => ({
    ru: parseBlockContent(section.section.type, ru?.contentJson ?? null),
    uk: parseBlockContent(section.section.type, uk?.contentJson ?? null),
  }), [section.section.type, ru?.contentJson, uk?.contentJson])

  const handleContentSave = useCallback(async (locale: 'ru' | 'uk', contentJson: string) => {
    setSaving(true)
    try {
      const fd = new FormData()
      fd.set('locale', locale)
      fd.set('content_json', contentJson)
      await updateSectionContent(section.section.id, fd)
      onUpdate(section.section.id, locale, contentJson)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }, [section.section.id, onUpdate])

  const handleDelete = useCallback(async () => {
    if (!confirm('Видалити секцію?')) return
    try {
      await deleteSection(section.section.id)
      onDelete(section.section.id)
    } catch (err) {
      console.error(err)
    }
  }, [section.section.id, onDelete])

  const handleToggle = useCallback(async () => {
    const next = !section.section.enabled
    try {
      await toggleSection(section.section.id, next)
      onToggle(section.section.id, next)
    } catch (err) {
      console.error(err)
    }
  }, [section.section.id, section.section.enabled, onToggle])

  const def = getBlockDefinition(section.section.type)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border transition-colors ${
        section.section.enabled ? 'border-zinc-700/50 bg-zinc-900/30' : 'border-zinc-800/30 bg-zinc-900/10 opacity-60'
      }`}
    >
      {/* Header bar */}
      <div
        className={`flex items-center gap-2 px-3 py-2 border-b ${
          section.section.enabled ? 'border-zinc-800/50' : 'border-zinc-800/20'
        }`}
      >
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-zinc-600 hover:text-zinc-400 transition-colors"
          aria-label="Перетягнути"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <span className="text-sm">{def?.icon ?? '📄'}</span>
        <span className="text-sm font-medium text-zinc-300 truncate">{def?.labelUk ?? def?.label ?? section.section.type}</span>
        <span className="text-xs text-zinc-600 font-mono">{section.section.key}</span>

        <div className="flex-1" />

        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-500" />}

        <button
          onClick={handleToggle}
          className="rounded p-1 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          title={section.section.enabled ? 'Вимкнути' : 'Увімкнути'}
        >
          {section.section.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={handleDelete}
          className="rounded p-1 text-zinc-600 hover:text-red-400 hover:bg-zinc-800 transition-colors"
          title="Видалити"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Editor body */}
      {section.section.enabled && (
        <div className="p-3">
          <BlockEditorPanel
            sectionType={section.section.type}
            sectionKey={section.section.key}
            content={blockContent}
            onSave={handleContentSave}
          />
        </div>
      )}
    </div>
  )
}

export function SectionEditor({ pageId, sections: initialSections }: SectionEditorProps) {
  const [sections, setSections] = useState(initialSections)
  const [sectionOrder, setSectionOrder] = useState<string[] | null>(null)
  const [showLibrary, setShowLibrary] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)
  const [pending, setPending] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const blockDefs = getAllBlockDefinitions()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const handleAddSection = useCallback(async (formData: FormData) => {
    setPending(true)
    setAddError(null)

    const type = String(formData.get('type') ?? 'text-block')
    const key = `${type}-${Date.now()}`
    formData.set('key', key)
    formData.set('sortOrder', String(sections.length))

    try {
      const { sectionId } = await addSection(pageId, formData)

      const ruContent = String(formData.get('ru_contentJson') ?? '')
      const ukContent = String(formData.get('uk_contentJson') ?? '')

      const translations: PageSectionWithTranslations['translations'] = [
        { id: '', sectionId, locale: 'ru' as const, contentJson: ruContent || null },
        { id: '', sectionId, locale: 'uk' as const, contentJson: ukContent || null },
      ]

      const newSection: PageSectionWithTranslations = {
        section: {
          id: sectionId,
          pageId,
          key,
          type,
          enabled: true,
          sortOrder: sections.length,
          settingsJson: '{}',
        },
        translations,
      }

      setSections((prev) => [...prev, newSection])
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Невідома помилка')
    } finally {
      setPending(false)
    }
  }, [pageId, sections.length])

  const handleInsertTemplate = useCallback((tpl: { sectionType: string; contentRu: string; contentUk: string }) => {
    const fd = new FormData()
    fd.set('type', tpl.sectionType)
    fd.set('ru_contentJson', tpl.contentRu)
    fd.set('uk_contentJson', tpl.contentUk)
    handleAddSection(fd)
  }, [handleAddSection])

  const handleUpdate = useCallback((id: string, locale: 'ru' | 'uk', contentJson: string) => {
    setSections((prev) => prev.map((s) => {
      if (s.section.id !== id) return s
      return {
        ...s,
        translations: s.translations.map((t) =>
          t.locale === locale ? { ...t, contentJson } : t,
        ),
      }
    }))
  }, [])

  const handleDelete = useCallback((id: string) => {
    setSections((prev) => prev.filter((s) => s.section.id !== id))
  }, [])

  const handleToggle = useCallback((id: string, enabled: boolean) => {
    setSections((prev) => prev.map((s) =>
      s.section.id === id ? { ...s, section: { ...s.section, enabled } } : s,
    ))
  }, [])

  // Current section order (either from drag state or from sections)
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
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
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
                  {b.icon} {b.labelUk}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
          >
            {pending ? 'Додавання…' : '+ Додати'}
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
