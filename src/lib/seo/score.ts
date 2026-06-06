/**
 * SEO Score — система оцінки якості SEO-метаданих.
 *
 * Повертає score (0-100) та список проблем (SeoIssue[]).
 * Використовується в SeoEditor для зворотнього зв'язку редактору.
 */

export type Severity = 'error' | 'warning' | 'info'

export interface SeoIssue {
  type: string
  severity: Severity
  message: string
}

export interface SeoScoreResult {
  score: number
  issues: SeoIssue[]
}

export interface SeoMetaData {
  title?: string | null
  description?: string | null
  keywords?: string | null
  canonicalPath?: string | null
  ogTitle?: string | null
  ogDescription?: string | null
  ogImageId?: string | null
  robotsIndex?: boolean
  robotsFollow?: boolean
  schemaType?: string | null
  locale?: string
}

/**
 * Розраховує SEO-оцінку для метаданих сторінки.
 * Кожен критерій додає бали до загальної суми (макс 100).
 */
export function calculateSeoScore(meta: SeoMetaData): SeoScoreResult {
  const issues: SeoIssue[] = []
  let score = 0

  /* ── 1. Title exists (+10) ── */
  if (meta.title && meta.title.trim().length > 0) {
    score += 10

    /* ── 2. Title length 30-65 chars (+10) ── */
    const titleLen = meta.title.trim().length
    if (titleLen >= 30 && titleLen <= 65) {
      score += 10
    } else if (titleLen > 65) {
      issues.push({ type: 'title_too_long', severity: 'warning', message: `Meta-title занадто довгий (${titleLen} символів). Рекомендується 30-65.` })
    } else if (titleLen < 30) {
      issues.push({ type: 'title_too_short', severity: 'warning', message: `Meta-title занадто короткий (${titleLen} символів). Рекомендується 30-65.` })
    }
  } else {
    issues.push({ type: 'no_title', severity: 'error', message: 'Meta-title відсутній. Додайте заголовок сторінки.' })
  }

  /* ── 3. Description exists (+10) ── */
  if (meta.description && meta.description.trim().length > 0) {
    score += 10

    /* ── 4. Description length 120-160 chars (+10) ── */
    const descLen = meta.description.trim().length
    if (descLen >= 120 && descLen <= 160) {
      score += 10
    } else if (descLen > 160) {
      issues.push({ type: 'description_too_long', severity: 'warning', message: `Meta-description занадто довгий (${descLen} символів). Рекомендується 120-160.` })
    } else if (descLen < 120) {
      issues.push({ type: 'description_too_short', severity: 'info', message: `Meta-description коротший за рекомендацію (${descLen} символів). Рекомендується 120-160.` })
    }
  } else {
    issues.push({ type: 'no_description', severity: 'error', message: 'Meta-description відсутній. Додайте опис сторінки.' })
  }

  /* ── 5. Canonical exists and absolute (+10) ── */
  if (meta.canonicalPath && meta.canonicalPath.trim().length > 0) {
    score += 10
    if (meta.canonicalPath.startsWith('http')) {
      issues.push({ type: 'canonical_absolute_path', severity: 'info', message: 'Canonical містить повний URL. Рекомендується використовувати відносний шлях (напр. /ru/uslugi/...).' })
    }
  } else {
    issues.push({ type: 'no_canonical', severity: 'warning', message: 'Canonical шлях не вказано. Буде використано URL за замовчуванням.' })
  }

  /* ── 6. OG:Image exists (+10) ── */
  if (meta.ogImageId && meta.ogImageId.trim().length > 0) {
    score += 10
  } else {
    issues.push({ type: 'no_og_image', severity: 'warning', message: 'OG:Image не вибрано. Буде використано зображення за замовчуванням.' })
  }

  /* ── 7. OG:Title exists (+10) ── */
  if (meta.ogTitle && meta.ogTitle.trim().length > 0) {
    score += 10
  } else {
    issues.push({ type: 'no_og_title', severity: 'info', message: 'OG:Title не вказано. Буде використано meta-title.' })
  }

  /* ── 8. OG:Description exists (+10) ── */
  if (meta.ogDescription && meta.ogDescription.trim().length > 0) {
    score += 10
  } else {
    issues.push({ type: 'no_og_description', severity: 'info', message: 'OG:Description не вказано. Буде використано meta-description.' })
  }

  /* ── 9. Robots: index+follow для публічних сторінок (+10) ── */
  if (meta.robotsIndex !== false && meta.robotsFollow !== false) {
    score += 10
  }

  /* ── 10. Schema type configured (+10) ── */
  if (meta.schemaType && meta.schemaType.trim().length > 0) {
    score += 10
  }

  /* ── Бонуси: відсутність поганих практик ── */

  // Перевірка на PLACEHOLDER
  const allText = [
    meta.title, meta.description, meta.ogTitle, meta.ogDescription, meta.keywords,
  ].filter(Boolean).join(' ').toLowerCase()
  if (allText.includes('placeholder')) {
    issues.push({ type: 'placeholder_text', severity: 'error', message: 'Текст містить "PLACEHOLDER" — замініть на реальний контент.' })
  }
  if (allText.includes('lorem ipsum')) {
    issues.push({ type: 'lorem_ipsum', severity: 'error', message: 'Текст містить "lorem ipsum" — замініть на реальний контент.' })
  }

  // Перевірка на common.siteTitle та undefined
  if (allText.includes('common.sitetitle') || allText.includes('common.')) {
    issues.push({ type: 'translation_key', severity: 'error', message: 'Текст містить ключ перекладу (common.*) — замініть на реальний текст.' })
  }
  if (allText.includes('undefined') || allText.includes('null')) {
    issues.push({ type: 'undefined_null', severity: 'error', message: 'Текст містить "undefined" або "null" — замініть на реальний контент.' })
  }

  return { score, issues }
}

/**
 * Повертає колір для відображення score.
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400'
  if (score >= 60) return 'text-amber-400'
  if (score >= 40) return 'text-orange-400'
  return 'text-red-400'
}

/**
 * Повертає колір фону для полоски score.
 */
export function getScoreBarColor(score: number): string {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-amber-500'
  if (score >= 40) return 'bg-orange-500'
  return 'bg-red-500'
}

/**
 * Повертає текстову оцінку рівня SEO.
 */
export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Відмінно'
  if (score >= 80) return 'Дуже добре'
  if (score >= 70) return 'Добре'
  if (score >= 60) return 'Задовільно'
  if (score >= 40) return 'Потребує доопрацювання'
  return 'Критично'
}
