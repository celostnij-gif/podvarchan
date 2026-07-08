import { describe, it, expect } from 'vitest'
import {
  resolveServiceSlug,
  resolveBlogSlug,
  resolveCategorySlug,
  SERVICE_SLUG_UK,
  BLOG_SLUG_UK,
  CATEGORY_SLUG_UK,
  SERVICE_SLUG_FROM_UK,
  BLOG_SLUG_FROM_UK,
  CATEGORY_SLUG_FROM_UK,
} from '@/lib/slugMapping'

describe('slug mappings', () => {
  describe('SERVICE_SLUG_UK', () => {
    it('has UK translations for all RU slugs', () => {
      // verify all reverse mappings exist
      for (const [ru, uk] of Object.entries(SERVICE_SLUG_UK)) {
        expect(uk).toBeTruthy()
        // UK may equal RU when slug is the same in both languages
      }
    })

    it('maps every RU slug to a unique UK slug', () => {
      const ukSlugs = Object.values(SERVICE_SLUG_UK)
      expect(new Set(ukSlugs).size).toBe(ukSlugs.length)
    })
  })

  describe('BLOG_SLUG_UK', () => {
    it('has UK translations for all RU slugs', () => {
      for (const [ru, uk] of Object.entries(BLOG_SLUG_UK)) {
        expect(uk).toBeTruthy()
        expect(ru).not.toEqual(uk)
      }
    })

    it('maps every RU slug to a unique UK slug', () => {
      const ukSlugs = Object.values(BLOG_SLUG_UK)
      expect(new Set(ukSlugs).size).toBe(ukSlugs.length)
    })
  })

  describe('CATEGORY_SLUG_UK', () => {
    it('has UK translations for all RU slugs', () => {
      for (const [ru, uk] of Object.entries(CATEGORY_SLUG_UK)) {
        expect(uk).toBeTruthy()
      }
    })
  })

  describe('reverse mappings', () => {
    it('SERVICE_SLUG_FROM_UK mirrors SERVICE_SLUG_UK', () => {
      for (const [ru, uk] of Object.entries(SERVICE_SLUG_UK)) {
        expect(SERVICE_SLUG_FROM_UK[uk]).toBe(ru)
      }
    })

    it('BLOG_SLUG_FROM_UK mirrors BLOG_SLUG_UK', () => {
      for (const [ru, uk] of Object.entries(BLOG_SLUG_UK)) {
        expect(BLOG_SLUG_FROM_UK[uk]).toBe(ru)
      }
    })

    it('CATEGORY_SLUG_FROM_UK mirrors CATEGORY_SLUG_UK', () => {
      for (const [ru, uk] of Object.entries(CATEGORY_SLUG_UK)) {
        expect(CATEGORY_SLUG_FROM_UK[uk]).toBe(ru)
      }
    })
  })

  describe('resolveServiceSlug', () => {
    it('returns the slug as-is for RU slugs', () => {
      expect(resolveServiceSlug('gipnoterapiya-onlayn')).toBe('gipnoterapiya-onlayn')
    })

    it('resolves UK slugs to RU', () => {
      expect(resolveServiceSlug('hipnoterapiya-onlayn')).toBe('gipnoterapiya-onlayn')
    })

    it('returns unknown slugs as-is', () => {
      expect(resolveServiceSlug('unknown-slug')).toBe('unknown-slug')
    })
  })

  describe('resolveBlogSlug', () => {
    it('returns the slug as-is for RU slugs', () => {
      const ruSlug = Object.keys(BLOG_SLUG_UK)[0]
      expect(resolveBlogSlug(ruSlug)).toBe(ruSlug)
    })

    it('resolves UK slugs to RU', () => {
      for (const [ru, uk] of Object.entries(BLOG_SLUG_UK)) {
        expect(resolveBlogSlug(uk)).toBe(ru)
      }
    })
  })

  describe('resolveCategorySlug', () => {
    it('returns the slug as-is for RU slugs', () => {
      const ruSlug = Object.keys(CATEGORY_SLUG_UK)[0]
      expect(resolveCategorySlug(ruSlug)).toBe(ruSlug)
    })

    it('resolves UK slugs to RU', () => {
      for (const [ru, uk] of Object.entries(CATEGORY_SLUG_UK)) {
        expect(resolveCategorySlug(uk)).toBe(ru)
      }
    })
  })
})
