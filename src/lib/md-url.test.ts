import { describe, expect, it } from 'vitest'
import { validateMdTarget } from './md-url'

describe('validateMdTarget', () => {
  const origin = 'https://podvarchan.com'
  it('accepts canonical localized public paths', () => {
    const result = validateMdTarget('https://podvarchan.com/uk/poslugy/gipnoterapiya/', origin)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.url.pathname).toBe('/uk/poslugy/gipnoterapiya/')
  })
  it('rejects invalid origins and paths', () => {
    expect(validateMdTarget('https://example.com/ru/', origin)).toEqual({ ok: false, reason: 'invalid-origin' })
    expect(validateMdTarget('https://podvarchan.com/ru/no_trailing', origin)).toEqual({ ok: false, reason: 'invalid-path' })
  })
})
