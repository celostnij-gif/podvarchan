/**
 * Site-side thin re-export of the types and helpers that page.tsx needs.
 * The full blueprint with Zod schemas lives in apps/admin/src/lib/home/blueprint.ts.
 */

export interface HeroContent {
  title: string
  subtitle: string
  ctaPrimary: string
  ctaSecondary: string
  benefits: string[]
}

/**
 * Parse a zone's content_json string into typed content.
 * Returns defaults if contentJson is empty/invalid.
 */
export function parseZoneContent(
  zone: string,
  contentJson?: string | null,
): HeroContent {
  const defaults: HeroContent = { title: '', subtitle: '', ctaPrimary: '', ctaSecondary: '', benefits: [] }
  if (!contentJson) return defaults
  try {
    const parsed = JSON.parse(contentJson)
    if (zone === 'hero') {
      return {
        title: parsed.title ?? defaults.title,
        subtitle: parsed.subtitle ?? defaults.subtitle,
        ctaPrimary: parsed.ctaPrimary ?? defaults.ctaPrimary,
        ctaSecondary: parsed.ctaSecondary ?? defaults.ctaSecondary,
        benefits: Array.isArray(parsed.benefits) ? parsed.benefits : defaults.benefits,
      }
    }
    return defaults
  } catch {
    return defaults
  }
}
