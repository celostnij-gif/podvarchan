import { describe, it, expect } from 'vitest'
import { validateSchema, validateAllSchemas } from './validate'

describe('validateSchema()', () => {
  it('validates a correct Person schema', () => {
    const result = validateSchema({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'John Doe',
      url: 'https://example.com',
    })
    expect(result.valid).toBe(true)
    expect(result.type).toBe('Person')
    expect(result.errors).toHaveLength(0)
  })

  it('validates a correct Article schema', () => {
    const result = validateSchema({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Test Article',
      author: { '@type': 'Person', name: 'Author' },
      datePublished: '2024-01-01',
    })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects missing @context', () => {
    const result = validateSchema({
      '@type': 'Person',
      name: 'John',
      url: 'https://example.com',
    })
    expect(result.errors).toContain('Отсутствует @context')
  })

  it('warns on wrong @context', () => {
    const result = validateSchema({
      '@context': 'http://wrong.org',
      '@type': 'Person',
      name: 'John',
      url: 'https://example.com',
    })
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings[0]).toContain('@context должен быть')
  })

  it('rejects missing @type', () => {
    const result = validateSchema({
      '@context': 'https://schema.org',
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Отсутствует @type')
  })

  it('rejects missing required fields for known types', () => {
    const result = validateSchema({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Test',
      // Missing: author, datePublished
    })
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    const errorFields = result.errors.map(e => e)
    expect(errorFields.some(e => e.includes('author'))).toBe(true)
    expect(errorFields.some(e => e.includes('datePublished'))).toBe(true)
  })

  it('warns on empty arrays', () => {
    const result = validateSchema({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [],
    })
    expect(result.warnings.some(w => w.includes('Пустой массив'))).toBe(true)
  })

  it('warns on non-absolute @id', () => {
    const result = validateSchema({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'John',
      url: 'https://example.com',
      '@id': 'relative/path',
    })
    expect(result.warnings.some(w => w.includes('@id должен быть'))).toBe(true)
  })

  it('does not warn on absolute @id', () => {
    const result = validateSchema({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'John',
      url: 'https://example.com',
      '@id': 'https://example.com/#person',
    })
    expect(result.warnings.some(w => w.includes('@id'))).toBe(false)
  })

  it('warns on unknown schema types', () => {
    const result = validateSchema({
      '@context': 'https://schema.org',
      '@type': 'UnknownType',
      name: 'Test',
    })
    expect(result.warnings.some(w => w.includes('Неизвестный тип'))).toBe(true)
  })

  it('validates MedicalBusiness with required fields', () => {
    const result = validateSchema({
      '@context': 'https://schema.org',
      '@type': 'MedicalBusiness',
      name: 'Test Clinic',
      url: 'https://example.com',
    })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects null values for required fields', () => {
    const result = validateSchema({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: null,
      url: 'https://example.com',
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('name'))).toBe(true)
  })

  it('rejects empty string values for required fields', () => {
    const result = validateSchema({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: '',
      url: 'https://example.com',
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('name'))).toBe(true)
  })
})

describe('validateAllSchemas()', () => {
  it('validates multiple schemas', () => {
    const schemas = [
      {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'John',
        url: 'https://example.com',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Test',
        author: 'Author',
        datePublished: '2024-01-01',
      },
    ]
    const results = validateAllSchemas(schemas)
    expect(results).toHaveLength(2)
    expect(results[0].valid).toBe(true)
    expect(results[1].valid).toBe(true)
  })

  it('handles mixed valid and invalid schemas', () => {
    const schemas = [
      {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'John',
        url: 'https://example.com',
      },
      {},
    ]
    const results = validateAllSchemas(schemas)
    expect(results[0].valid).toBe(true)
    expect(results[1].valid).toBe(false)
  })
})
