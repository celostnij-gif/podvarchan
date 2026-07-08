import { describe, it, expect } from 'vitest'
import {
  computeAuditSummary,
  scoreColorClass,
  scoreLabel,
  googleSnippetPreview,
} from '@/lib/seo/audit'
import type { SeoUrlRow } from '@/lib/seo/audit'

const makeRow = (overrides: Partial<SeoUrlRow>): SeoUrlRow => ({
  url: '/ru/test',
  locale: 'ru',
  entityType: 'service',
  entityId: 'test',
  title: 'Test Title',
  description: 'Test Description',
  h1: 'Test H1',
  hasContent: true,
  wordCount: 500,
  score: 50,
  warnings: [],
  ...overrides,
})

describe('scoreColorClass', () => {
  it('returns green class for score >= 40', () => {
    expect(scoreColorClass(40)).toBe('text-green-600 bg-green-50')
    expect(scoreColorClass(50)).toBe('text-green-600 bg-green-50')
  })

  it('returns yellow class for 20 <= score < 40', () => {
    expect(scoreColorClass(20)).toBe('text-yellow-600 bg-yellow-50')
    expect(scoreColorClass(30)).toBe('text-yellow-600 bg-yellow-50')
    expect(scoreColorClass(39)).toBe('text-yellow-600 bg-yellow-50')
  })

  it('returns red class for score < 20', () => {
    expect(scoreColorClass(0)).toBe('text-red-600 bg-red-50')
    expect(scoreColorClass(10)).toBe('text-red-600 bg-red-50')
    expect(scoreColorClass(19)).toBe('text-red-600 bg-red-50')
  })
})

describe('scoreLabel', () => {
  it('labels 40+ as Good', () => expect(scoreLabel(40)).toBe('Good'))
  it('labels 20-39 as Needs work', () => expect(scoreLabel(30)).toBe('Needs work'))
  it('labels <20 as Poor', () => expect(scoreLabel(10)).toBe('Poor'))
})

describe('computeAuditSummary', () => {
  it('returns zeroes for empty array', () => {
    const s = computeAuditSummary([])
    expect(s).toEqual({ total: 0, avgScore: 0, green: 0, yellow: 0, red: 0 })
  })

  it('classifies a single green row', () => {
    const rows = [makeRow({ score: 45 })]
    const s = computeAuditSummary(rows)
    expect(s.total).toBe(1)
    expect(s.avgScore).toBe(45)
    expect(s.green).toBe(1)
    expect(s.yellow).toBe(0)
    expect(s.red).toBe(0)
  })

  it('classifies a single yellow row', () => {
    const rows = [makeRow({ score: 30 })]
    const s = computeAuditSummary(rows)
    expect(s.total).toBe(1)
    expect(s.avgScore).toBe(30)
    expect(s.green).toBe(0)
    expect(s.yellow).toBe(1)
    expect(s.red).toBe(0)
  })

  it('classifies a single red row', () => {
    const rows = [makeRow({ score: 10 })]
    const s = computeAuditSummary(rows)
    expect(s.total).toBe(1)
    expect(s.avgScore).toBe(10)
    expect(s.green).toBe(0)
    expect(s.yellow).toBe(0)
    expect(s.red).toBe(1)
  })

  it('computes average across mixed scores', () => {
    const rows = [
      makeRow({ url: '/ru/a', score: 50 }),
      makeRow({ url: '/ru/b', score: 30 }),
      makeRow({ url: '/ru/c', score: 10 }),
    ]
    const s = computeAuditSummary(rows)
    expect(s.total).toBe(3)
    expect(s.avgScore).toBe(30) // (50 + 30 + 10) / 3 = 30
    expect(s.green).toBe(1)
    expect(s.yellow).toBe(1)
    expect(s.red).toBe(1)
  })

  it('handles boundary scores', () => {
    const rows = [
      makeRow({ url: '/ru/a', score: 40 }),
      makeRow({ url: '/ru/b', score: 39 }),
      makeRow({ url: '/ru/c', score: 20 }),
      makeRow({ url: '/ru/d', score: 19 }),
    ]
    const s = computeAuditSummary(rows)
    expect(s.green).toBe(1)  // 40
    expect(s.yellow).toBe(2) // 39, 20
    expect(s.red).toBe(1)    // 19
  })
})

describe('googleSnippetPreview', () => {
  it('includes domain and URL', () => {
    const result = googleSnippetPreview('My Title', 'My Description', '/ru/uslugi/test')
    expect(result).toContain('Podvarchan.com')
    expect(result).toContain('uslugi/test')
    expect(result).toContain('My Title')
    expect(result).toContain('My Description')
  })

  it('falls back to placeholders for null title/description', () => {
    const result = googleSnippetPreview(null, null, '/ru/')
    expect(result).toContain('No title')
    expect(result).toContain('No description')
  })

  it('truncates long description at 160 chars', () => {
    const long = 'a'.repeat(200)
    const result = googleSnippetPreview('T', long, '/')
    // Should contain first 157 chars + '...'
    expect(result).toContain('a'.repeat(157) + '...')
    expect(result).not.toContain('a'.repeat(200))
  })

  it('strips locale prefix from display URL', () => {
    const result = googleSnippetPreview('X', 'Y', '/ru/uslugi/test')
    expect(result).toContain('uslugi/test')
    expect(result).not.toContain('/ru/uslugi/test')

    const resultUk = googleSnippetPreview('X', 'Y', '/uk/blog/post')
    expect(resultUk).toContain('blog/post')
    expect(resultUk).not.toContain('/uk/blog/post')
  })

  it('sanitizes trailing slash from display URL', () => {
    const result = googleSnippetPreview('X', 'Y', '/ru/uslugi/')
    expect(result).toContain('uslugi')
    expect(result).not.toContain('uslugi//')
  })
})
