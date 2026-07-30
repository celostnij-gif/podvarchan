/**
 * Cached wrappers for frequent D1 public queries.
 *
 * Every page load hits 5–7 D1 queries. This module adds a KV caching layer
 * so repeated requests read from KV (~1–5ms) instead of D1 (~20–80ms each).
 *
 * Cache writes are deferred via ctx.waitUntil() — they don't consume the
 * current request's CPU budget (Free Plan = 10ms limit).
 *
 * Usage in page / layout components:
 *   import { getCachedNavigation } from '@/lib/db/cached-public'
 *   const nav = await getCachedNavigation('HEADER', locale)
 */

import { withCache } from './kv-cache'
import {
  getNavigation,
  getServices,
  getPageByType,
  getFAQs,
  getTestimonials,
  getServiceSidebar,
  getBlogCategories,
  getContactChannels,
  getSiteSetting,
} from './public'
import type {
  NavItemPublic,
  ServicePublic,
  PagePublic,
  FAQPublic,
  TestimonialPublic,
  ServiceSidebarItem,
  BlogCategoryPublic,
  ContactChannelPublic,
} from './public'

/* ── TTLs (seconds) ── */

// Navigation rarely changes → 10 min
const TTL_NAV = 600

// Services, pages, FAQs, testimonials change via admin → 5 min
const TTL_CONTENT = 300

/* ── Navigation ── */

export function getCachedNavigation(
  location: 'HEADER' | 'FOOTER' | 'MOBILE',
  locale: string,
): Promise<NavItemPublic[]> {
  return withCache(`nav:${location}:${locale}`, TTL_NAV, () =>
    getNavigation(location, locale),
  )
}

/* ── Services (full) ── */

export function getCachedServices(locale: string): Promise<ServicePublic[]> {
  return withCache(`services:${locale}`, TTL_CONTENT, () =>
    getServices(locale),
  )
}

/* ── Services sidebar (lightweight, for footer/sidebar) ── */

export function getCachedServiceSidebar(
  locale: string,
): Promise<ServiceSidebarItem[]> {
  return withCache(`svcbar:${locale}`, TTL_CONTENT, () =>
    getServiceSidebar(locale),
  )
}

/* ── Blog categories ── */

export function getCachedBlogCategories(
  locale: string,
): Promise<BlogCategoryPublic[]> {
  return withCache(`cat:${locale}`, TTL_CONTENT, () =>
    getBlogCategories(locale),
  )
}

/* ── Contact channels ── */

export function getCachedContactChannels(): Promise<ContactChannelPublic[]> {
  return withCache('contacts', TTL_CONTENT, () => getContactChannels())
}

/* ── Site setting (single key) ── */

export function getCachedSiteSetting(key: string): Promise<unknown | null> {
  return withCache(`setting:${key}`, TTL_CONTENT, () => getSiteSetting(key))
}

/* ── Page by type (HOME, METHOD, ABOUT, FAQ, CONTACTS, PRIVACY, DISCLAIMER, PRICING, CUSTOM) ── */

export function getCachedPageByType(
  type: string,
  locale: string,
): Promise<PagePublic | null> {
  return withCache(`page:${type}:${locale}`, TTL_CONTENT, () =>
    getPageByType(
      type as
        | 'HOME'
        | 'METHOD'
        | 'ABOUT'
        | 'FAQ'
        | 'CONTACTS'
        | 'PRIVACY'
        | 'DISCLAIMER'
        | 'PRICING'
        | 'CUSTOM',
      locale,
    ),
  )
}

/* ── FAQs ── */

export function getCachedFAQs(
  locale: string,
  group?: string,
): Promise<FAQPublic[]> {
  return withCache(`faq:${group ?? 'all'}:${locale}`, TTL_CONTENT, () =>
    getFAQs(locale, group),
  )
}

/* ── Testimonials ── */

export function getCachedTestimonials(
  locale: string,
): Promise<TestimonialPublic[]> {
  return withCache(`testimonials:${locale}`, TTL_CONTENT, () =>
    getTestimonials(locale),
  )
}
