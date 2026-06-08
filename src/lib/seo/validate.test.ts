import { describe, it, expect } from 'vitest'
import { validateBeforePublish, validateSeoBeforePublish, YMYL_WORDS } from './validate'

describe('YMYL_WORDS', () => {
  it('contains YMYL-sensitive terms', () => {
    expect(Object.keys(YMYL_WORDS).length).toBeGreaterThan(0)
    expect(YMYL_WORDS).toHaveProperty('вылечим')
    expect(YMYL_WORDS).toHaveProperty('гарантируем')
    expect(YMYL_WORDS).toHaveProperty('стопроцентный')
    expect(YMYL_WORDS).toHaveProperty('пациент')
  })
})

describe('validateBeforePublish()', () => {
  it('passes valid content', () => {
    const result = validateBeforePublish({
      title: 'Гипнотерапия онлайн — работа с подсознанием',
      description: 'Узнайте, как гипнотерапия онлайн помогает справиться с тревогой, паническими атаками и внутренними блоками через работу с подсознанием.',
      slug: 'gipnoterapiya-onlayn',
      content: 'Гипнотерапия — это метод работы с подсознанием, который позволяет выявить и трансформировать глубинные убеждения.',
    })
    expect(result.canPublish).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('fails on empty title', () => {
    const result = validateBeforePublish({
      title: '',
      description: 'Some description that is long enough to pass the minimum length check for SEO purposes.',
      slug: 'test-slug',
    })
    expect(result.canPublish).toBe(false)
    expect(result.errors.some(e => e.field === 'title')).toBe(true)
  })

  it('fails on null title', () => {
    const result = validateBeforePublish({
      title: null,
      description: 'Description that is sufficiently long to meet the minimum length requirement of eighty characters.',
      slug: 'slug',
    })
    expect(result.canPublish).toBe(false)
    expect(result.errors.some(e => e.field === 'title')).toBe(true)
  })

  it('fails on empty description', () => {
    const result = validateBeforePublish({
      title: 'Valid title for this test case',
      description: '',
      slug: 'valid-slug',
    })
    expect(result.canPublish).toBe(false)
    expect(result.errors.some(e => e.field === 'description')).toBe(true)
  })

  it('fails on empty slug', () => {
    const result = validateBeforePublish({
      title: 'Title for testing purposes here',
      description: 'Good description that is long enough to pass the minimum length check for validation.',
      slug: '',
    })
    expect(result.canPublish).toBe(false)
    expect(result.errors.some(e => e.field === 'slug')).toBe(true)
  })

  it('fails on PLACEHOLDER text', () => {
    const result = validateBeforePublish({
      title: 'PLACEHOLDER Title',
      description: 'Some description about PLACEHOLDER content for this test scenario.',
      slug: 'test',
    })
    expect(result.canPublish).toBe(false)
    expect(result.errors.some(e => e.message.includes('PLACEHOLDER'))).toBe(true)
  })

  it('fails on text containing "null" or "undefined"', () => {
    const result = validateBeforePublish({
      title: 'Title for testing purposes here',
      description: 'This is undefined content for the test to validate error detection.',
      slug: 'test',
    })
    expect(result.canPublish).toBe(false)
    expect(result.errors.some(e => e.message.includes('undefined'))).toBe(true)
  })

  it('fails on translation keys in text', () => {
    const result = validateBeforePublish({
      title: 'common.siteTitle',
      description: 'This description is long enough to pass the minimum length requirement for testing.',
      slug: 'test',
    })
    expect(result.canPublish).toBe(false)
    expect(result.errors.some(e => e.message.includes('ключ'))).toBe(true)
  })

  it('fails on nav. translation keys', () => {
    const result = validateBeforePublish({
      title: 'Title for testing nav keys in validation',
      description: 'nav.blog is not valid for publishing content through the SEO validator.',
      slug: 'test',
    })
    expect(result.canPublish).toBe(false)
    expect(result.errors.some(e => e.message.includes('ключ'))).toBe(true)
  })

  it('warns on YMYL words', () => {
    const result = validateBeforePublish({
      title: 'Мы вылечим вашу тревогу',
      description: 'Гарантируем полное излечение с помощью наших методов и подходов гипнотерапии.',
      slug: 'test',
    })
    // Should still be publishable (only warnings, not errors)
    expect(result.canPublish).toBe(true)
    expect(result.warnings.length).toBeGreaterThan(0)
    const warningMessages = result.warnings.map(w => w.message)
    expect(warningMessages.some(m => m.includes('вылечим'))).toBe(true)
    expect(warningMessages.some(m => m.includes('гарантируем'))).toBe(true)
    expect(warningMessages.some(m => m.includes('излечение'))).toBe(true)
  })

  it('warns on too short title (< 20 chars)', () => {
    const result = validateBeforePublish({
      title: 'Короткий',
      description: 'A valid description that is long enough for testing purposes and SEO validation checks.',
      slug: 'test',
    })
    expect(result.warnings.some(w => w.field === 'title' && w.message.includes('короткий'))).toBe(true)
  })

  it('warns on too short description (< 80 chars)', () => {
    const result = validateBeforePublish({
      title: 'Valid title for SEO test scenario here',
      description: 'Short desc',
      slug: 'test',
    })
    expect(result.warnings.some(w => w.field === 'description' && w.message.includes('короткий'))).toBe(true)
  })

  it('warns on cyrillic slug', () => {
    const result = validateBeforePublish({
      title: 'Title for testing purpose only here',
      description: 'Description that is long enough for testing purposes to pass validation checks.',
      slug: 'тест-слаг',
    })
    expect(result.warnings.some(w => w.field === 'slug' && w.message.includes('кирилич'))).toBe(true)
  })

  it('handles content with null/undefined gracefully', () => {
    const result = validateBeforePublish({
      title: undefined,
      description: undefined,
      slug: undefined,
    })
    expect(result.canPublish).toBe(false)
    expect(result.errors.length).toBeGreaterThanOrEqual(3)
  })

  it('warns on multiple YMYL violations', () => {
    const result = validateBeforePublish({
      title: 'Title for testing YMYL detection',
      description: 'Мы гарантируем стопроцентный результат лечения с помощью гипнотерапии онлайн.',
      slug: 'test',
    })
    expect(result.warnings.length).toBeGreaterThanOrEqual(3)
  })
})

describe('validateSeoBeforePublish()', () => {
  it('fails on missing slug (SEO only validates title/description)', () => {
    // validateSeoBeforePublish doesn't pass slug, so it will always fail on slug check
    const result = validateSeoBeforePublish({
      title: 'Test Page Title for SEO',
      description: 'This is a meta description that should be long enough to pass the minimum length requirement.',
    })
    // Fails because slug is missing (validateBeforePublish requires slug)
    expect(result.canPublish).toBe(false)
    expect(result.errors.some(e => e.field === 'slug')).toBe(true)
    expect(result.errors.some(e => e.field === 'title')).toBe(false)
    expect(result.errors.some(e => e.field === 'description')).toBe(false)
  })

  it('fails on empty title even with locale', () => {
    const result = validateSeoBeforePublish({
      title: '',
      description: 'Some description that is long enough to pass all validation checks easily.',
    })
    expect(result.canPublish).toBe(false)
  })

  it('fails on missing slug with locale', () => {
    // validateSeoBeforePublish doesn't pass slug even with locale
    const result = validateSeoBeforePublish({
      title: 'Valid SEO Title Here for testing purposes only',
      description: 'A valid meta description that is sufficiently long for the validation to pass all checks.',
      locale: 'ru',
    })
    expect(result.canPublish).toBe(false)
    expect(result.errors.some(e => e.field === 'slug')).toBe(true)
  })
})
