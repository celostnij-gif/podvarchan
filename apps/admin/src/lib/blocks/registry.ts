import type { BlockDefinition } from './types'
import { HeroEditor, TextBlockEditor, StatsEditor, CTAEditor } from './editors'

/**
 * Block Registry — центральный реестр всех типов блоков.
 *
 * Каждый блок знает:
 * - Какой JSON производит (defaultContent)
 * - Как его редактировать (editor component)
 * - Мета-информацию (label, icon)
 *
 * Добавление нового блока = просто registerBlock({...}) в любом файле.
 */

const registry = new Map<string, BlockDefinition>()

export function registerBlock(def: BlockDefinition): void {
  if (registry.has(def.type)) {
    console.warn(`[BlockRegistry] Block type "${def.type}" already registered — overwriting`)
  }
  registry.set(def.type, def)
}

export function getBlockDefinition(type: string): BlockDefinition | undefined {
  return registry.get(type)
}

export function getAllBlockDefinitions(): BlockDefinition[] {
  return Array.from(registry.values())
}

/**
 * Parse contentJson string into a Record.
 * Returns defaultContent if parsing fails or content is empty.
 */
export function parseBlockContent(
  type: string,
  contentJson: string | null | undefined,
): Record<string, unknown> {
  const def = getBlockDefinition(type)
  const defaults = def?.defaultContent ?? {}

  if (!contentJson) return { ...defaults }

  try {
    const parsed = JSON.parse(contentJson)
    return { ...defaults, ...parsed }
  } catch {
    return { ...defaults }
  }
}

/**
 * Serialize block content back to JSON string for storage.
 */
export function serializeBlockContent(content: Record<string, unknown>): string {
  return JSON.stringify(content)
}

/* ── Register built-in block types ── */

registerBlock({
  type: 'hero',
  label: 'Hero',
  labelUk: 'Hero',
  icon: '🏠',
  description: 'Главный экран с заголовком, подзаголовком и кнопкой',
  editor: HeroEditor,
  defaultContent: { title: '', subtitle: '', cta: '' },
  fields: [
    { name: 'title', type: 'text', label: 'Заголовок', labelUk: 'Заголовок', required: true },
    { name: 'subtitle', type: 'textarea', label: 'Подзаголовок', labelUk: 'Підзаголовок' },
    { name: 'cta', type: 'text', label: 'Текст кнопки', labelUk: 'Текст кнопки' },
  ],
})

registerBlock({
  type: 'text-block',
  label: 'Текстовый блок',
  labelUk: 'Текстовий блок',
  icon: '📝',
  description: 'Простой текстовый блок с заголовком и HTML-содержимым',
  editor: TextBlockEditor,
  defaultContent: { title: '', body: '' },
  fields: [
    { name: 'title', type: 'text', label: 'Заголовок', labelUk: 'Заголовок' },
    { name: 'body', type: 'textarea', label: 'Текст (HTML)', labelUk: 'Текст (HTML)' },
  ],
})

registerBlock({
  type: 'stats',
  label: 'Статистика',
  labelUk: 'Статистика',
  icon: '📊',
  description: 'Блок с числовыми показателями (клиенты, года, сессии)',
  editor: StatsEditor,
  defaultContent: { title: '', items: [] },
  fields: [
    { name: 'title', type: 'text', label: 'Заголовок', labelUk: 'Заголовок' },
    { name: 'items', type: 'array', label: 'Элементы', labelUk: 'Елементи',
      itemFields: [
        { name: 'value', type: 'text', label: 'Значение', labelUk: 'Значення' },
        { name: 'label', type: 'text', label: 'Подпись', labelUk: 'Підпис' },
      ],
    },
  ],
})

registerBlock({
  type: 'cta',
  label: 'CTA',
  labelUk: 'CTA',
  icon: '🎯',
  description: 'Блок призыва к действию с заголовком, текстом и кнопкой',
  editor: CTAEditor,
  defaultContent: { title: '', subtitle: '', buttonText: '', buttonLink: '' },
  fields: [
    { name: 'title', type: 'text', label: 'Заголовок', labelUk: 'Заголовок' },
    { name: 'subtitle', type: 'textarea', label: 'Подзаголовок', labelUk: 'Підзаголовок' },
    { name: 'buttonText', type: 'text', label: 'Текст кнопки', labelUk: 'Текст кнопки' },
    { name: 'buttonLink', type: 'text', label: 'Ссылка кнопки', labelUk: 'Посилання кнопки' },
  ],
})

registerBlock({
  type: 'testimonials-ref',
  label: 'Отзывы',
  labelUk: 'Відгуки',
  icon: '💬',
  description: 'Ссылка на блок отзывов (отображает отзывы из CRM)',
  editor: CTAEditor, // Reuse CTA layout since it has similar fields
  defaultContent: { title: '' },
  fields: [
    { name: 'title', type: 'text', label: 'Заголовок', labelUk: 'Заголовок' },
  ],
})

registerBlock({
  type: 'contact-form',
  label: 'Форма контактов',
  labelUk: 'Форма контактів',
  icon: '📬',
  description: 'Блок с формой обратной связи',
  editor: CTAEditor, // Reuse CTA layout
  defaultContent: { title: '', subtitle: '' },
  fields: [
    { name: 'title', type: 'text', label: 'Заголовок', labelUk: 'Заголовок' },
    { name: 'subtitle', type: 'textarea', label: 'Подзаголовок', labelUk: 'Підзаголовок' },
  ],
})
