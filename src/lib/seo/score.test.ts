import { describe, it, expect } from 'vitest'
import { calculateSeoScore, getScoreColor, getScoreBarColor, getScoreLabel } from './score'

describe('calculateSeoScore()', () => {
  it('returns 100 for perfect metadata', () => {
    const result = calculateSeoScore({
      title: 'Идеальный заголовок страницы с SEO',
      description: 'Это идеальное описание страницы, которое содержит все необходимые ключевые слова и укладывается в рекомендации по длине для лучшего ранжирования.',
      ogTitle: 'Open Graph Title',
      ogDescription: 'Open graph description text for social sharing purposes.',
      ogImageId: 'image-123',
      canonicalPath: '/ru/uslugi/test/',
      robotsIndex: true,
      robotsFollow: true,
      schemaType: 'Article',
    })
    expect(result.score).toBe(100)
    expect(result.issues).toHaveLength(0)
  })

  it('penalizes missing title', () => {
    const result = calculateSeoScore({
      title: null,
      description: 'Description',
    })
    expect(result.score).toBeLessThan(100)
    expect(result.issues.some(i => i.type === 'no_title')).toBe(true)
  })

  it('penalizes missing description', () => {
    const result = calculateSeoScore({
      title: 'Valid Title',
      description: null,
    })
    expect(result.issues.some(i => i.type === 'no_description')).toBe(true)
  })

  it('warns on title too long (> 65 chars)', () => {
    const result = calculateSeoScore({
      title: 'Це дуже довгий заголовок сторінки який явно перевищує шістдесят п\'ять символів',
      description: 'Normal description',
    })
    expect(result.issues.some(i => i.type === 'title_too_long')).toBe(true)
  })

  it('warns on title too short (< 30 chars)', () => {
    const result = calculateSeoScore({
      title: 'Короткий',
      description: 'Normal description',
    })
    expect(result.issues.some(i => i.type === 'title_too_short')).toBe(true)
  })

  it('warns on description too long (> 160 chars)', () => {
    const result = calculateSeoScore({
      title: 'Normal Title',
      description: 'X'.repeat(200),
    })
    expect(result.issues.some(i => i.type === 'description_too_long')).toBe(true)
  })

  it('informs on description too short (< 120 chars)', () => {
    const result = calculateSeoScore({
      title: 'Normal Title',
      description: 'Short',
    })
    expect(result.issues.some(i => i.type === 'description_too_short')).toBe(true)
  })

  it('warns on missing canonical', () => {
    const result = calculateSeoScore({
      title: 'Normal Title',
      description: 'Normal description that is long enough',
      canonicalPath: null,
    })
    expect(result.issues.some(i => i.type === 'no_canonical')).toBe(true)
  })

  it('warns on missing OG image', () => {
    const result = calculateSeoScore({
      title: 'Normal Title',
      description: 'Normal description that is long enough',
      canonicalPath: '/test/',
    })
    expect(result.issues.some(i => i.type === 'no_og_image')).toBe(true)
  })

  it('detects PLACEHOLDER text', () => {
    const result = calculateSeoScore({
      title: 'PLACEHOLDER title',
      description: 'Description',
    })
    expect(result.issues.some(i => i.type === 'placeholder_text')).toBe(true)
  })

  it('detects Lorem Ipsum', () => {
    const result = calculateSeoScore({
      title: 'Title',
      description: 'lorem ipsum dolor sit amet',
    })
    expect(result.issues.some(i => i.type === 'lorem_ipsum')).toBe(true)
  })

  it('detects translation keys', () => {
    const result = calculateSeoScore({
      title: 'common.siteTitle',
      description: 'Description',
    })
    expect(result.issues.some(i => i.type === 'translation_key')).toBe(true)
  })

  it('detects undefined/null in text', () => {
    const result = calculateSeoScore({
      title: 'Title',
      description: 'undefined',
    })
    expect(result.issues.some(i => i.type === 'undefined_null')).toBe(true)
  })

  it('calculates partial scores correctly', () => {
    const result = calculateSeoScore({
      title: 'Добрий заголовок для SEO',
      description: null,
      canonicalPath: null,
    })
    // title exists (+10), title 28 chars (<30 → no bonus)
    // robotsIndex/robotsFollow undefined → both !== false → +10
    // Total: 10 + 10 = 20
    expect(result.score).toBe(20)
  })

  it('handles edge case with all fields empty', () => {
    const result = calculateSeoScore({})
    // robotsIndex/robotsFollow are undefined → both !== false → +10
    expect(result.score).toBe(10)
    expect(result.issues.length).toBeGreaterThan(0)
  })
})

describe('getScoreColor()', () => {
  it('returns green for scores >= 80', () => {
    expect(getScoreColor(80)).toContain('green')
    expect(getScoreColor(100)).toContain('green')
  })

  it('returns amber for scores 60-79', () => {
    expect(getScoreColor(60)).toContain('amber')
    expect(getScoreColor(79)).toContain('amber')
  })

  it('returns orange for scores 40-59', () => {
    expect(getScoreColor(40)).toContain('orange')
    expect(getScoreColor(59)).toContain('orange')
  })

  it('returns red for scores < 40', () => {
    expect(getScoreColor(0)).toContain('red')
    expect(getScoreColor(39)).toContain('red')
  })
})

describe('getScoreBarColor()', () => {
  it('returns green-500 for scores >= 80', () => {
    expect(getScoreBarColor(85)).toBe('bg-green-500')
  })

  it('returns amber-500 for scores 60-79', () => {
    expect(getScoreBarColor(65)).toBe('bg-amber-500')
  })

  it('returns orange-500 for scores 40-59', () => {
    expect(getScoreBarColor(50)).toBe('bg-orange-500')
  })

  it('returns red-500 for scores < 40', () => {
    expect(getScoreBarColor(20)).toBe('bg-red-500')
  })
})

describe('getScoreLabel()', () => {
  it('returns Отлично for score >= 90', () => {
    expect(getScoreLabel(95)).toBe('Відмінно')
  })

  it('returns Дуже добре for score 80-89', () => {
    expect(getScoreLabel(85)).toBe('Дуже добре')
  })

  it('returns Добре for score 70-79', () => {
    expect(getScoreLabel(75)).toBe('Добре')
  })

  it('returns Задовільно for score 60-69', () => {
    expect(getScoreLabel(65)).toBe('Задовільно')
  })

  it('returns Потребує доопрацювання for score 40-59', () => {
    expect(getScoreLabel(50)).toBe('Потребує доопрацювання')
  })

  it('returns Критично for score < 40', () => {
    expect(getScoreLabel(30)).toBe('Критично')
  })
})
