import { describe, it, expect } from 'vitest'
import { resolveUaRedirect } from '@/lib/uaRedirect'

/**
 * Phase 0.4 (2026-08-25): /ua/* must resolve to the FINAL UK path in a single
 * 301 — no chaining through /uk/uslugi/* → /uk/poslugy/* etc.
 */
describe('resolveUaRedirect', () => {
  it('returns null for non-/ua paths', () => {
    expect(resolveUaRedirect('/ru/uslugi/')).toBeNull()
    expect(resolveUaRedirect('/uk/blog/x/')).toBeNull()
    expect(resolveUaRedirect('/ukraine/')).toBeNull() // '/ua' must be followed by '/' or end
  })

  it('does not match paths merely containing "ua"', () => {
    // '/uax/...' and '/blog/ua/' are not locale aliases
    expect(resolveUaRedirect('/uax/uslugi/')).toBeNull()
    expect(resolveUaRedirect('/blog/ua/')).toBeNull()
  })

  it('bare /ua → /uk/', () => {
    expect(resolveUaRedirect('/ua')).toBe('/uk/')
    expect(resolveUaRedirect('/ua/')).toBe('/uk/')
  })

  it('is case-insensitive on the alias prefix', () => {
    expect(resolveUaRedirect('/UA/uslugi/')).toBe('/uk/poslugy/')
    expect(resolveUaRedirect('/Ua/metod/')).toBe('/uk/metod/')
  })

  it('services catalog: uslugi → poslugy in the same hop', () => {
    expect(resolveUaRedirect('/ua/uslugi')).toBe('/uk/poslugy/')
    expect(resolveUaRedirect('/ua/uslugi/')).toBe('/uk/poslugy/')
    expect(resolveUaRedirect('/ua/poslugy/')).toBe('/uk/poslugy/')
  })

  it('service slugs localized in the same hop', () => {
    expect(resolveUaRedirect('/ua/uslugi/trevoga-i-panicheskiye-ataki/')).toBe(
      '/uk/poslugy/trivoga-i-panichni-ataki/',
    )
    expect(resolveUaRedirect('/ua/uslugi/hipnoterapiya-onlayn/')).toBe(
      '/uk/poslugy/hipnoterapiya-onlayn/',
    ) // already UK slug — unchanged
  })

  it('blog posts and categories localized in the same hop', () => {
    expect(resolveUaRedirect('/ua/blog/pochemu-voznikaet-panika-nochyu/')).toBe(
      '/uk/blog/chomu-vinikaye-panika-vnochi/',
    )
    expect(resolveUaRedirect('/ua/blog/kategoriya/trevoga/')).toBe(
      '/uk/blog/kategoriya/trivoga/',
    )
  })

  it('static page renames: tseny → tsiny, ob-avtore → pro-avtora', () => {
    expect(resolveUaRedirect('/ua/tseny/')).toBe('/uk/tsiny/')
    expect(resolveUaRedirect('/ua/ob-avtore')).toBe('/uk/pro-avtora/')
  })

  it('unmapped sections pass through with locale swap only', () => {
    expect(resolveUaRedirect('/ua/metod/')).toBe('/uk/metod/')
    expect(resolveUaRedirect('/ua/faq')).toBe('/uk/faq/')
  })
})
