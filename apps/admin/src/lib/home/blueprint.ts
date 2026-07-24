/**
 * Home Studio Blueprint — canonical source for homepage zones.
 *
 * One section per zone, keyed deterministically.  Editor UI reads this;
 * server actions seed + validate against it.  No new DB tables.
 */

import { z } from 'zod'

/* ── Zone keys (ordered top-to-bottom) ── */

export const HOME_ZONE_KEYS = [
  'hero',
  'problems',
  'method',
  'services',
  'author',
  'testimonials',
  'faq',
  'cta',
] as const

export type HomeZoneKey = (typeof HOME_ZONE_KEYS)[number]

/* ── Zone metadata ── */

export interface ZoneMeta {
  /** Visible label in admin sidebar */
  label: string
  /** Section type stored in D1 page_sections.type */
  type: 'hero' | 'text-block' | 'timeline' | 'services-grid' | 'image-text' | 'testimonials-ref' | 'faq-group-ref' | 'cta'
  /** Whether zone ships enabled by default */
  defaultEnabled: boolean
  /** Sort order (lower = higher on page) */
  sortOrder: number
}

export const HOME_ZONE_META: Record<HomeZoneKey, ZoneMeta> = {
  hero:         { label: 'Hero / Главный экран',     type: 'hero',              defaultEnabled: true,  sortOrder: 10 },
  problems:     { label: 'Проблемы',                  type: 'text-block',        defaultEnabled: true,  sortOrder: 20 },
  method:       { label: 'Метод',                     type: 'timeline',          defaultEnabled: true,  sortOrder: 30 },
  services:     { label: 'Услуги',                    type: 'services-grid',     defaultEnabled: true,  sortOrder: 40 },
  author:       { label: 'Автор / О себе',            type: 'image-text',        defaultEnabled: true,  sortOrder: 50 },
  testimonials: { label: 'Отзывы',                    type: 'testimonials-ref',  defaultEnabled: true,  sortOrder: 60 },
  faq:          { label: 'FAQ',                        type: 'faq-group-ref',     defaultEnabled: true,  sortOrder: 70 },
  cta:          { label: 'CTA / Призыв',              type: 'cta',              defaultEnabled: true,  sortOrder: 80 },
}

/* ── Zod schemas (per-zone content_json) ── */

// -- Hero (text-only; rich tags parse on client) --
const heroItemSchema = z.object({
  title: z.string().optional().default(''),
  subtitle: z.string().optional().default(''),
  ctaPrimary: z.string().optional().default(''),
  ctaSecondary: z.string().optional().default(''),
  benefits: z.array(z.string()).optional().default([]),
})
export type HeroContent = z.infer<typeof heroItemSchema>

// -- Problems --
const problemItemSchema = z.object({
  icon: z.string().optional().default(''),
  title: z.string().optional().default(''),
  subtitle: z.string().optional().default(''),
})
const problemsContentSchema = z.object({
  heading: z.string().optional().default(''),
  headingAccent: z.string().optional().default(''),
  items: z.array(problemItemSchema).optional().default([]),
  calloutTitle: z.string().optional().default(''),
  calloutAccent: z.string().optional().default(''),
  calloutText: z.string().optional().default(''),
  cta: z.string().optional().default(''),
})
export type ProblemsContent = z.infer<typeof problemsContentSchema>

// -- Method --
const methodItemSchema = z.object({
  title: z.string().optional().default(''),
  description: z.string().optional().default(''),
  duration: z.string().optional().default(''),
})
const methodContentSchema = z.object({
  heading: z.string().optional().default(''),
  subtitle: z.string().optional().default(''),
  items: z.array(methodItemSchema).optional().default([]),
})
export type MethodContent = z.infer<typeof methodContentSchema>

// -- Services (ref) --
const servicesContentSchema = z.object({
  heading: z.string().optional().default(''),
  subtitle: z.string().optional().default(''),
  allLink: z.string().optional().default(''),
})
export type ServicesContent = z.infer<typeof servicesContentSchema>

// -- Author (image-text) --
const authorContentSchema = z.object({
  headingPrefix: z.string().optional().default(''),
  headingHighlight: z.string().optional().default(''),
  headingSuffix: z.string().optional().default(''),
  paragraphs: z.array(z.string()).optional().default([]),
  readMore: z.string().optional().default(''),
  readMoreLink: z.string().optional().default(''),
  experience: z.string().optional().default(''),
  education: z.string().optional().default(''),
})
export type AuthorContent = z.infer<typeof authorContentSchema>

// -- Testimonials (ref) --
const testimonialsContentSchema = z.object({
  heading: z.string().optional().default(''),
  subtitle: z.string().optional().default(''),
})
export type TestimonialsContent = z.infer<typeof testimonialsContentSchema>

// -- FAQ (ref) --
const faqContentSchema = z.object({
  heading: z.string().optional().default(''),
  subtitle: z.string().optional().default(''),
})
export type FaqContent = z.infer<typeof faqContentSchema>

// -- CTA --
const ctaContentSchema = z.object({
  title: z.string().optional().default(''),
  description: z.string().optional().default(''),
  button: z.string().optional().default(''),
})
export type CtaContent = z.infer<typeof ctaContentSchema>

/* ── Discriminated union — parse any zone content ── */

export const HOME_ZONE_SCHEMAS = {
  hero:         heroItemSchema,
  problems:     problemsContentSchema,
  method:       methodContentSchema,
  services:     servicesContentSchema,
  author:       authorContentSchema,
  testimonials: testimonialsContentSchema,
  faq:          faqContentSchema,
  cta:          ctaContentSchema,
} as const satisfies Record<HomeZoneKey, z.ZodType>

export type HomeZoneContentMap = {
  [K in HomeZoneKey]: z.infer<(typeof HOME_ZONE_SCHEMAS)[K]>
}

/** Parse raw JSON string into typed zone content, falling back to defaults. */
export function parseZoneContent<K extends HomeZoneKey>(
  key: K,
  raw: string | null | undefined,
): HomeZoneContentMap[K] {
  const schema = HOME_ZONE_SCHEMAS[key]
  if (!raw) return schema.parse({}) as HomeZoneContentMap[K]
  try {
    const parsed = JSON.parse(raw)
    return schema.parse(parsed) as HomeZoneContentMap[K]
  } catch {
    return schema.parse({}) as HomeZoneContentMap[K]
  }
}

/** Serialize zone content to JSON string. */
export function serializeZoneContent(content: Record<string, unknown>): string {
  return JSON.stringify(content)
}

/* ── noEmptyOverwrite guard ── */

/**
 * Returns true if `incoming` would overwrite non-empty `existing` content
 * with empty content.  Use before saving to prevent accidental wipe.
 */
export function wouldOverwriteNonEmpty(
  existing: string | null | undefined,
  incoming: string | null | undefined,
): boolean {
  if (!existing || existing === '{}' || existing === 'null') return false
  if (!incoming || incoming === '{}' || incoming === 'null') return true
  try {
    const ex = JSON.parse(existing)
    const inc = JSON.parse(incoming)
    // incoming is empty object but existing has real data
    const incomingEmpty = Object.keys(inc).length === 0 ||
      Object.values(inc).every(v => v === '' || v === null || v === undefined || (Array.isArray(v) && v.length === 0))
    const existingHasData = Object.keys(ex).length > 0 &&
      Object.values(ex).some(v => v !== '' && v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0))
    return incomingEmpty && existingHasData
  } catch {
    return false
  }
}

/* ── Publish gate (hero title non-empty in both locales) ── */

export function isPublishable(heroRu: HeroContent, heroUk: HeroContent): boolean {
  const ruOk = heroRu.title.trim().length > 0
  const ukOk = heroUk.title.trim().length > 0
  return ruOk && ukOk
}

/* ── Default content per zone (Russian; Ukrainian uses same structure) ── */

export const HOME_DEFAULTS: Record<HomeZoneKey, Record<string, unknown>> = {
  hero: {
    title: 'Избавиться от тревоги и панических атак',
    subtitle: 'Помогаю справиться с тревогой, паническими атаками, самосаботажем и неуверенностью через эриксоновский гипноз — мягко, без давления и с проработкой первопричины. Онлайн, в вашем темпе.',
    ctaPrimary: 'Записаться на консультацию',
    ctaSecondary: 'Узнать о методе',
    benefits: [],
  },
  problems: {
    heading: 'Что привело вас',
    headingAccent: 'сюда',
    items: [
      { icon: 'brain', title: 'Тревога и панические атаки', subtitle: 'Постоянное напряжение, приступы паники' },
      { icon: 'block', title: 'Самосаботаж', subtitle: 'Ставите цели, но внутри сопротивление' },
      { icon: 'burn', title: 'Выгорание', subtitle: 'Энергии нет, пропал интерес' },
    ],
    calloutTitle: 'С каждым из этих состояний',
    calloutAccent: 'можно работать',
    calloutText: 'Гипнотерапия помогает мягко убрать первопричину.',
    cta: 'Записаться на консультацию',
  },
  method: {
    heading: 'Как проходит работа',
    subtitle: 'Структурированный процесс от первой встречи до результата.',
    items: [
      { title: 'Знакомство и ваш запрос', description: 'Бесплатная диагностическая консультация.', duration: '' },
      { title: 'Сессия гипнотерапии', description: '50–60 минут трансформационной работы.', duration: '50–60 мин' },
      { title: 'Интеграция и закрепление', description: 'Домашние практики для закрепления.', duration: '' },
      { title: 'Курс и поддержка', description: '5–10 сессий для устойчивого результата.', duration: '' },
    ],
  },
  services: {
    heading: 'Услуги гипнотерапии онлайн',
    subtitle: 'Выберите направление или запишитесь на консультацию.',
    allLink: 'Все направления',
  },
  author: {
    headingPrefix: 'О ',
    headingHighlight: 'методе',
    headingSuffix: ' и специалисте',
    paragraphs: [],
    readMore: 'Подробнее обо мне',
    readMoreLink: '/ob-avtore',
    experience: '15+ лет практики',
    education: 'Психология, музыкальная терапия',
  },
  testimonials: {
    heading: 'Что говорят клиенты',
    subtitle: 'Реальные истории людей, которые пришли с болью и ушли с результатом.',
  },
  faq: {
    heading: 'Частые вопросы',
    subtitle: 'Всё, что вы хотели знать о гипнотерапии онлайн.',
  },
  cta: {
    title: 'Готовы начать?',
    description: 'Запишитесь на бесплатную 15-минутную консультацию онлайн.',
    button: 'Записаться на консультацию',
  },
}

/** Merge incoming content with defaults, filling missing keys. */
export function mergeContentDefaults<K extends HomeZoneKey>(
  key: K,
  incoming: Partial<HomeZoneContentMap[K]>,
): HomeZoneContentMap[K] {
  const defaults = HOME_DEFAULTS[key]
  return { ...defaults, ...incoming } as HomeZoneContentMap[K]
}
