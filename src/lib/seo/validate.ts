/**
 * SEO Validation — перевірка перед публікацією контенту.
 *
 * Блокує публікацію при критичних помилках (errors) і попереджає про
 * недоліки (warnings), включно з YMYL-перевіркою для медичної ніші.
 */

/**
 * YMYL-слова та фрази, які не можна використовувати в YMYL-ніші (гіпнотерапія).
 * Ключ — проблемний вираз, значення — пропозиція заміни.
 */
export const YMYL_WORDS: Record<string, string> = {
  'вылечим': '«допоможемо» або «ми працюємо з»',
  'гарантируем': '«прагнемо до» або «наша мета»',
  'гарантия': '«результати, які можливі»',
  'навсегда избавим': '«допоможемо зменшити прояви»',
  'навсегда избавиться': '«зменшити вплив»',
  'полное излечение': '«позитивна динаміка»',
  'стопроцентный': '«високий відсоток»',
  '100%': 'конкретні результати без гарантій',
  'без врача': '«під керівництвом фахівця»',
  'медицинский результат': '«терапевтичний ефект»',
  'лечение': '«робота з» (у контексті гіпнотерапії)',
  'диагноз': '«стан» або «запит»',
  'пациент': '«клієнт» (для гіпнотерапії)',
  'исцеление': '«трансформація» або «позитивні зміни»',
}

/**
 * Результат валідації перед публікацією.
 */
export interface ValidationResult {
  canPublish: boolean
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
}

export interface ValidationIssue {
  field: string
  message: string
  suggestion?: string
}

/**
 * Дані для валідації перед публікацією.
 */
export interface PublishCheckData {
  title?: string | null
  description?: string | null
  slug?: string | null
  content?: string | null
  locale?: string
}

/**
 * Перевіряє контент перед публікацією.
 * Повертає errors (блокують публікацію) та warnings (рекомендації).
 */
export function validateBeforePublish(data: PublishCheckData): ValidationResult {
  const errors: ValidationIssue[] = []
  const warnings: ValidationIssue[] = []

  /* ═══════════════════════════════════════
     Блокуючі помилки (errors)
     ═══════════════════════════════════════ */

  // 1. Пустий title
  if (!data.title || data.title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Заголовок (title) обов\'язковий для публікації.' })
  }

  // 2. Пустий meta description
  if (!data.description || data.description.trim().length === 0) {
    errors.push({ field: 'description', message: 'Meta-description обов\'язковий для публікації.' })
  }

  // 3. Пустий slug
  if (!data.slug || data.slug.trim().length === 0) {
    errors.push({ field: 'slug', message: 'Slug обов\'язковий для публікації.' })
  }

  // 4. PLACEHOLDER в тексті
  const allText = [data.title, data.description, data.content].filter(Boolean).join(' ')
  const lowerText = allText.toLowerCase()

  if (lowerText.includes('placeholder')) {
    errors.push({ field: 'content', message: 'Текст містить "PLACEHOLDER". Замініть на реальний контент перед публікацією.' })
  }

  // 5. null/undefined в тексті
  if (lowerText.includes('null') || lowerText.includes('undefined')) {
    errors.push({ field: 'content', message: 'Текст містить "null" або "undefined". Виправте перед публікацією.' })
  }

  // 6. Ключі перекладу
  if (lowerText.includes('common.') || lowerText.includes('nav.')) {
    errors.push({ field: 'content', message: 'Текст містить ключі перекладу (common.* або nav.*). Замініть на реальний текст.' })
  }

  /* ═══════════════════════════════════════
     Попередження (warnings)
     ═══════════════════════════════════════ */

  // 1. YMYL-перевірка
  for (const [word, suggestion] of Object.entries(YMYL_WORDS)) {
    if (lowerText.includes(word.toLowerCase())) {
      warnings.push({
        field: 'content',
        message: `Знайдено потенційно проблемне слово "${word}". Рекомендуємо замінити на ${suggestion}.`,
        suggestion: `Замініть "${word}" на ${suggestion}`,
      })
    }
  }

  // 2. Занадто короткий title
  if (data.title && data.title.length < 20) {
    warnings.push({ field: 'title', message: 'Заголовок занадто короткий. Рекомендується не менше 20 символів.' })
  }

  // 3. Занадто короткий description
  if (data.description && data.description.length < 80) {
    warnings.push({ field: 'description', message: 'Meta-description занадто короткий. Рекомендується не менше 80 символів.' })
  }

  // 4. Перевірка slug на кирилицю (slug має бути латиницею)
  if (data.slug && /[а-яА-ЯЁё]/.test(data.slug)) {
    warnings.push({ field: 'slug', message: 'Slug містить кириличні символи. Рекомендується використовувати латиницю.' })
  }

  return {
    canPublish: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Перевіряє SEO-метадані (обгортка над validateBeforePublish для SEO).
 */
export function validateSeoBeforePublish(seoMeta: {
  title?: string | null
  description?: string | null
  locale?: string
}): ValidationResult {
  return validateBeforePublish({
    title: seoMeta.title,
    description: seoMeta.description,
    slug: undefined,
    locale: seoMeta.locale,
  })
}
