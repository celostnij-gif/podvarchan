import { describe, it, expect } from 'vitest'
import { cleanUrl } from './utils'

describe('cleanUrl()', () => {
  it('joins simple paths', () => {
    expect(cleanUrl('https://example.com', '/ru', '/page/'))
      .toBe('https://example.com/ru/page/')
  })

  it('removes duplicate slashes', () => {
    expect(cleanUrl('https://example.com//ru', '/page/'))
      .toBe('https://example.com/ru/page/')
  })

  it('preserves protocol double slash', () => {
    expect(cleanUrl('https://example.com', 'ru')).toBe('https://example.com/ru')
  })

  it('handles single path', () => {
    expect(cleanUrl('/single')).toBe('/single')
  })

  it('handles no trailing slash', () => {
    expect(cleanUrl('https://example.com', 'ru', 'uslugi'))
      .toBe('https://example.com/ru/uslugi')
  })

  it('works with base URL and locale', () => {
    expect(cleanUrl('https://podvarchan.com', 'uk', '/blog/'))
      .toBe('https://podvarchan.com/uk/blog/')
  })

  it('removes multiple consecutive slashes', () => {
    expect(cleanUrl('https://example.com///test///path/'))
      .toBe('https://example.com/test/path/')
  })

  it('does not break http:// protocol', () => {
    expect(cleanUrl('http://example.com', 'test'))
      .toBe('http://example.com/test')
  })

  it('handles empty parts', () => {
    expect(cleanUrl('https://example.com', '', '/test/'))
      .toBe('https://example.com/test/')
  })
})
