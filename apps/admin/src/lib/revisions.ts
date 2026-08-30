import { contentRevisions } from '@podvarchan/shared'
import { getActionDb } from '@/lib/actions/db'

export type RevisionKind = 'service' | 'blog_post' | 'faq_item' | 'page'

export interface SnapshotRow {
  id?: string | null
  [k: string]: unknown
}

export interface RevisionSnapshot {
  kind: RevisionKind
  main: SnapshotRow
  translations: SnapshotRow[]
}

/**
 * Persist the entity state BEFORE a mutation so it can be restored later.
 * dataJson stores a full snapshot: the main-table row plus every translation
 * row (all locales). seoMetaId is intentionally NOT part of the snapshot —
 * SEO overrides are edited separately and must never be reverted by a
 * content restore.
 */
export async function captureEntityRevision(input: {
  kind: RevisionKind
  entityId: string
  main: SnapshotRow
  translations: SnapshotRow[]
  userId: string
  label: string
}): Promise<void> {
  const db = await getActionDb()
  const snapshot: RevisionSnapshot = {
    kind: input.kind,
    main: input.main,
    translations: input.translations,
  }
  await db
    .insert(contentRevisions)
    .values({
      id: crypto.randomUUID(),
      entityType: input.kind,
      entityId: input.entityId,
      locale: null,
      dataJson: JSON.stringify(snapshot),
      createdById: input.userId,
      createdAt: new Date().toISOString(),
      label: input.label,
    })
    .run()
}

/* ── Coercers (data round-trips through JSON in the DB) ── */

const str = (v: unknown): string => (typeof v === 'string' ? v : '')
const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v) || 0)
const bool = (v: unknown): boolean => (typeof v === 'boolean' ? v : v === 1 || v === '1')
const maybeStr = (v: unknown): string | null => (typeof v === 'string' && v !== '' ? v : null)

export const localeOf = (v: unknown): 'ru' | 'uk' => (v === 'uk' ? 'uk' : 'ru')

/* ── Main-row value builders per kind (explicit, no `any`) ── */

export interface ServiceMainValues {
  slugBase: string
  icon: string | null
  category: string | null
  priority: number
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  featured: boolean
  sortOrder: number
}

export function serviceMainValues(main: SnapshotRow): ServiceMainValues {
  return {
    slugBase: str(main.slugBase),
    icon: maybeStr(main.icon),
    category: maybeStr(main.category),
    priority: num(main.priority),
    status: str(main.status) as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
    featured: bool(main.featured),
    sortOrder: num(main.sortOrder),
  }
}

export interface BlogMainValues {
  categoryId: string | null
  authorId: string | null
  status: 'DRAFT' | 'REVIEW' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED'
  coverImageId: string | null
  readingMinutes: number | null
  publishedAt: string | null
  scheduledAt: string | null
}

export function blogMainValues(main: SnapshotRow): BlogMainValues {
  return {
    categoryId: maybeStr(main.categoryId),
    authorId: maybeStr(main.authorId),
    status: str(main.status) as 'DRAFT' | 'REVIEW' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED',
    coverImageId: maybeStr(main.coverImageId),
    readingMinutes: maybeStr(main.readingMinutes) !== null ? num(main.readingMinutes) : null,
    publishedAt: maybeStr(main.publishedAt),
    scheduledAt: maybeStr(main.scheduledAt),
  }
}

export interface FaqMainValues {
  group: 'HOME' | 'GENERAL' | 'SERVICE' | 'CONTACTS'
  serviceId: string | null
  status: 'DRAFT' | 'PUBLISHED'
  sortOrder: number
}

export function faqMainValues(main: SnapshotRow): FaqMainValues {
  return {
    group: str(main.group) as 'HOME' | 'GENERAL' | 'SERVICE' | 'CONTACTS',
    serviceId: maybeStr(main.serviceId),
    status: str(main.status) as 'DRAFT' | 'PUBLISHED',
    sortOrder: num(main.sortOrder),
  }
}

export interface PageMainValues {
  type: 'HOME' | 'METHOD' | 'ABOUT' | 'FAQ' | 'CONTACTS' | 'PRIVACY' | 'DISCLAIMER' | 'PRICING' | 'CUSTOM'
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  sortOrder: number
  publishedAt: string | null
}

export function pageMainValues(main: SnapshotRow): PageMainValues {
  return {
    type: str(main.type) as PageMainValues['type'],
    status: str(main.status) as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
    sortOrder: num(main.sortOrder),
    publishedAt: maybeStr(main.publishedAt),
  }
}

/* ── Translation-row value builders per kind ── */

export interface ServiceTranslationTargetValues {
  slug: string
  title: string | null
  shortTitle: string | null
  description: string | null
  contentHtml: string | null
  heroTitle: string | null
  heroSubtitle: string | null
  symptomsJson: string | null
  processJson: string | null
  benefitsJson: string | null
  faqJson: string | null
  ctaText: string | null
}

export function serviceTranslationTargetValues(tr: SnapshotRow): ServiceTranslationTargetValues {
  return {
    slug: str(tr.slug),
    title: maybeStr(tr.title),
    shortTitle: maybeStr(tr.shortTitle),
    description: maybeStr(tr.description),
    contentHtml: maybeStr(tr.contentHtml),
    heroTitle: maybeStr(tr.heroTitle),
    heroSubtitle: maybeStr(tr.heroSubtitle),
    symptomsJson: maybeStr(tr.symptomsJson),
    processJson: maybeStr(tr.processJson),
    benefitsJson: maybeStr(tr.benefitsJson),
    faqJson: maybeStr(tr.faqJson),
    ctaText: maybeStr(tr.ctaText),
  }
}

export interface BlogTranslationValues {
  slug: string
  title: string | null
  excerpt: string | null
  contentJson: string | null
  contentHtml: string | null
  tableOfContentsJson: string | null
  faqJson: string | null
}

export function blogTranslationValues(tr: SnapshotRow): BlogTranslationValues {
  return {
    slug: str(tr.slug),
    title: maybeStr(tr.title),
    excerpt: maybeStr(tr.excerpt),
    contentJson: maybeStr(tr.contentJson),
    contentHtml: maybeStr(tr.contentHtml),
    tableOfContentsJson: maybeStr(tr.tableOfContentsJson),
    faqJson: maybeStr(tr.faqJson),
  }
}

export interface FaqTranslationValues {
  question: string | null
  answer: string | null
}

export function faqTranslationValues(tr: SnapshotRow): FaqTranslationValues {
  return { question: maybeStr(tr.question), answer: maybeStr(tr.answer) }
}

export interface PageTranslationValues {
  slug: string
  title: string | null
  excerpt: string | null
  contentJson: string | null
}

export function pageTranslationValues(tr: SnapshotRow): PageTranslationValues {
  return { slug: str(tr.slug), title: maybeStr(tr.title), excerpt: maybeStr(tr.excerpt), contentJson: maybeStr(tr.contentJson) }
}