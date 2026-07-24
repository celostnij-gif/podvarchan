import type { PageSectionPublic } from '@/lib/db/public'

/**
 * Parse a home zone's content_json from D1 sections.
 * Returns typed zone content or null if section/translation not found.
 *
 * On the public site, sections are already resolved to the user's locale
 * by the server component (page.tsx), so we match by section key.
 */

interface HeroD1 {
  title?: string
  subtitle?: string
  ctaPrimary?: string
  ctaSecondary?: string
  benefits?: string[]
}

interface ProblemsD1 {
  heading?: string
  headingAccent?: string
  items?: { icon?: string; title: string; subtitle?: string }[]
  calloutTitle?: string
  calloutText?: string
  cta?: string
}

interface MethodD1 {
  heading?: string
  subtitle?: string
  items?: { title: string; description?: string; duration?: string }[]
}

interface AuthorD1 {
  headingPrefix?: string
  headingHighlight?: string
  headingSuffix?: string
  paragraphs?: string[]
  readMore?: string
  experience?: string
  education?: string
}

interface CtaD1 {
  title?: string
  description?: string
  button?: string
}

interface ServicesD1 {
  heading?: string
  subtitle?: string
}

interface TestimonialsD1 {
  heading?: string
  subtitle?: string
}

interface FaqD1 {
  heading?: string
  subtitle?: string
}

type ZoneContentMap = {
  hero: HeroD1
  problems: ProblemsD1
  method: MethodD1
  author: AuthorD1
  cta: CtaD1
  services: ServicesD1
  testimonials: TestimonialsD1
  faq: FaqD1
}

export type { HeroD1, ProblemsD1, MethodD1, AuthorD1, CtaD1 }

export function parseHomeZoneContent<K extends keyof ZoneContentMap>(
  key: K,
  sections?: PageSectionPublic[],
): ZoneContentMap[K] | null {
  if (!sections) return null
  const section = sections.find((s) => s.key === key)
  if (!section?.contentJson) return null
  try {
    return JSON.parse(section.contentJson) as ZoneContentMap[K]
  } catch {
    return null
  }
}
