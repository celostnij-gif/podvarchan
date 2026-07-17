'use client'

import type { BlockEditorProps, FieldDefinition } from './types'
import { TextField, TextareaField, ToggleField, ImageField } from '@/components/admin/shared/FieldComponents'

interface DynamicBlockEditorProps extends BlockEditorProps {
  fields: FieldDefinition[]
}

/**
 * DynamicBlockEditor — auto-generates form fields from FieldDefinition[].
 *
 * Supports all field types: text, textarea, number, boolean, image, array, group.
 * Recursively renders array items and nested groups.
 * Uses locale-aware labels (label/labelUk) and placeholders.
 */
export function DynamicBlockEditor({ content, onChange, locale, fields }: DynamicBlockEditorProps) {
  const t = (field: FieldDefinition): string => {
    if (locale === 'uk' && field.labelUk) return field.labelUk
    return field.label
  }

  const pt = (field: FieldDefinition): string | undefined => {
    if (locale === 'uk' && field.placeholderUk) return field.placeholderUk
    return field.placeholder
  }

  const update = (name: string, value: unknown) => {
    onChange({ ...content, [name]: value })
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => renderField(field, content, update, t, pt, locale))}
    </div>
  )
}

/* ── Render a single field based on its type ── */

function renderField(
  field: FieldDefinition,
  content: Record<string, unknown>,
  update: (name: string, value: unknown) => void,
  t: (f: FieldDefinition) => string,
  pt: (f: FieldDefinition) => string | undefined,
  locale: 'ru' | 'uk',
): React.ReactNode {
  const value = content[field.name]

  switch (field.type) {
    case 'text':
      return (
        <div key={field.name}>
          <TextField
            label={t(field)}
            value={String(value ?? '')}
            onChange={(v) => update(field.name, v)}
            placeholder={pt(field)}
            required={field.required}
          />
        </div>
      )

    case 'textarea':
      return (
        <div key={field.name}>
          <TextareaField
            label={t(field)}
            value={String(value ?? '')}
            onChange={(v) => update(field.name, v)}
            placeholder={pt(field)}
            required={field.required}
          />
        </div>
      )

    case 'number':
      return (
        <div key={field.name}>
          <label className="block text-xs font-medium text-zinc-400 mb-1">
            {t(field)}
            {field.required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
          <input
            type="number"
            value={String(value ?? '')}
            onChange={(e) => update(field.name, e.target.valueAsNumber || 0)}
            placeholder={pt(field)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500
                       focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </div>
      )

    case 'boolean':
      return (
        <div key={field.name}>
          <ToggleField
            label={t(field)}
            value={Boolean(value)}
            onChange={(v) => update(field.name, v)}
          />
        </div>
      )

    case 'image':
      return (
        <div key={field.name}>
          <ImageField
            label={t(field)}
            value={String(value ?? '')}
            onChange={(v) => update(field.name, v)}
            placeholder={pt(field)}
          />
        </div>
      )

    case 'array':
      return (
        <div key={field.name}>
          <ArrayField
            field={field}
            value={(value as Record<string, unknown>[]) ?? []}
            onChange={(v) => update(field.name, v)}
            t={t}
            pt={pt}
            locale={locale}
          />
        </div>
      )

    case 'group': {
      // Scoped update that writes into the group's value, not the top-level content
      const groupUpdate = (subName: string, subValue: unknown) => {
        const groupContent = { ...(content[field.name] as Record<string, unknown> ?? {}) }
        update(field.name, { ...groupContent, [subName]: subValue })
      }
      return (
        <div key={field.name} className="rounded-lg border border-zinc-700/30 bg-zinc-900/20 p-3">
          <p className="text-xs font-medium text-zinc-500 mb-2">{t(field)}</p>
          <div className="space-y-3">
            {field.fields?.map((subField) =>
              renderField(subField, value as Record<string, unknown> ?? {}, groupUpdate, t, pt, locale),
            )}
          </div>
        </div>
      )
    }

    default:
      return null
  }
}

/* ── Array field — dynamic list with add / remove ── */

function ArrayField({
  field,
  value,
  onChange,
  t,
  pt,
  locale,
}: {
  field: FieldDefinition
  value: Record<string, unknown>[]
  onChange: (items: Record<string, unknown>[]) => void
  t: (f: FieldDefinition) => string
  pt: (f: FieldDefinition) => string | undefined
  locale: 'ru' | 'uk'
}) {
  const addItem = () => {
    const emptyItem: Record<string, unknown> = {}
    field.itemFields?.forEach((f) => {
      emptyItem[f.name] = f.defaultValue ?? ''
    })
    onChange([...value, emptyItem])
  }

  const removeItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, itemContent: Record<string, unknown>) => {
    const newVal = [...value]
    newVal[index] = itemContent
    onChange(newVal)
  }

  const moveItem = (from: number, to: number) => {
    const newVal = [...value]
    ;[newVal[from], newVal[to]] = [newVal[to], newVal[from]]
    onChange(newVal)
  }

  if (!field.itemFields || field.itemFields.length === 0) return null

  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-2">{t(field)}</label>
      <div className="space-y-2">
        {value.map((item, i) => (
          <div
            key={i}
            className="relative rounded-lg border border-zinc-700/50 bg-zinc-900/30 p-3"
          >
            <div className="absolute right-2 top-2 flex items-center gap-1">
              {i > 0 && (
                <button
                  type="button"
                  onClick={() => moveItem(i, i - 1)}
                  className="rounded px-1 py-0.5 text-xs text-zinc-500 hover:bg-zinc-800 transition-colors"
                  title={locale === 'uk' ? 'Вгору' : 'Вверх'}
                >
                  ↑
                </button>
              )}
              {i < value.length - 1 && (
                <button
                  type="button"
                  onClick={() => moveItem(i, i + 1)}
                  className="rounded px-1 py-0.5 text-xs text-zinc-500 hover:bg-zinc-800 transition-colors"
                  title={locale === 'uk' ? 'Вниз' : 'Вниз'}
                >
                  ↓
                </button>
              )}
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="rounded px-1.5 py-0.5 text-xs text-red-400 hover:bg-red-900/30 transition-colors"
                title={locale === 'uk' ? 'Видалити' : 'Удалить'}
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 pr-16">
              {field.itemFields!.map((itemField) =>
                renderField(
                  itemField,
                  item,
                  (name, val) => updateItem(i, { ...item, [name]: val }),
                  t,
                  pt,
                  locale,
                ),
              )}
            </div>
          </div>
        ))}
        {value.length === 0 && (
          <p className="text-xs text-zinc-600 text-center py-4 border border-dashed border-zinc-800 rounded-lg">
            {locale === 'uk' ? 'Поки що порожньо — додайте перший елемент' : 'Пока пусто — добавьте первый элемент'}
          </p>
        )}
        <button
          type="button"
          onClick={addItem}
          className="w-full rounded-lg border border-dashed border-zinc-700/50 py-2 text-xs text-zinc-500 hover:border-zinc-600 hover:text-zinc-400 transition-colors"
        >
          + {locale === 'uk' ? 'Додати елемент' : 'Добавить элемент'}
        </button>
      </div>
    </div>
  )
}
