import { describe, it, expect } from 'vitest'
import { parseDate } from '@/lib/dates'

describe('parseDate (sitemap lastmods — ISO + epoch-millis, план v3 Фаза 4)', () => {
  it('parses ISO 8601 strings', () => {
    const d = parseDate('2026-07-21T12:00:00.000Z')
    expect(d?.toISOString()).toBe('2026-07-21T12:00:00.000Z')
  })

  it('parses epoch-millis (13 digits) — исторический баг pages.updated_at', () => {
    const ms = Date.parse('2026-07-21T12:00:00.000Z')
    expect(parseDate(String(ms))?.getTime()).toBe(ms)
  })

  it('parses epoch-seconds (10 digits) as seconds, not millis', () => {
    const sec = 1784650000 // 2026-07-21 ≈
    expect(parseDate(String(sec))?.getTime()).toBe(sec * 1000)
  })

  it('returns undefined for null / undefined / empty', () => {
    expect(parseDate(null)).toBeUndefined()
    expect(parseDate(undefined)).toBeUndefined()
    expect(parseDate('')).toBeUndefined()
    expect(parseDate('   ')).toBeUndefined()
  })

  it('returns undefined for garbage', () => {
    expect(parseDate('не-дата')).toBeUndefined()
    expect(parseDate('12345')).toBeUndefined() // слишком короткий epoch
    expect(parseDate('0')).toBeUndefined()
  })

  it('accepts Date instances, rejecting Invalid Date', () => {
    expect(parseDate(new Date('2026-01-01T00:00:00Z'))?.getFullYear()).toBe(2026)
    expect(parseDate(new Date('nope'))).toBeUndefined()
  })
})
