'use server'

import { eq } from 'drizzle-orm'
import {
  contentRevisions,
  services,
  serviceTranslations,
  blogPosts,
  blogPostTranslations,
  faqItems,
  faqItemTranslations,
  pages,
  pageTranslations,
} from '@podvarchan/shared'
import { getActionDb } from './db'
import { requirePublish } from './ymyl'
import { writeAuditLog } from '@/lib/audit/log'
import {
  revalidatePublic,
  revalidateAdmin,
  getServiceRevalidatePaths,
  getServiceCacheKeys,
  getBlogPostRevalidatePaths,
  getBlogPostCacheKeys,
  getFaqRevalidatePaths,
  getPageRevalidatePaths,
  getPageCacheKeys,
  cacheKeyPrefixes,
} from '@/lib/revalidate'
import {
  serviceMainValues,
  blogMainValues,
  faqMainValues,
  pageMainValues,
  serviceTranslationTargetValues,
  blogTranslationValues,
  faqTranslationValues,
  pageTranslationValues,
  localeOf,
  type RevisionSnapshot,
  type SnapshotRow,
} from '@/lib/revisions'

type Db = Awaited<ReturnType<typeof getActionDb>>

const nowStr = (): string => new Date().toISOString()
const str = (v: unknown): string => (typeof v === 'string' ? v : '')

const ENTITY_TYPE: Record<string, string> = {
  service: 'SERVICE',
  blog_post: 'BLOG_POST',
  faq_item: 'FAQ',
  page: 'PAGE',
}

function loadSnapshot(dataJson: string | null): RevisionSnapshot {
  if (!dataJson) throw new Error('Ревізія не містить даних')
  return JSON.parse(dataJson) as RevisionSnapshot
}

async function captureSafety(db: Db, kind: string, entityId: string, userId: string | null, snapshot: RevisionSnapshot): Promise<void> {
  await db.insert(contentRevisions).values({
    id: crypto.randomUUID(),
    entityType: kind,
    entityId,
    locale: null,
    dataJson: JSON.stringify(snapshot),
    createdById: userId,
    createdAt: nowStr(),
    label: 'До відновлення',
  }).run()
}

async function readCurrentSnapshot(db: Db, kind: string, entityId: string): Promise<RevisionSnapshot | null> {
  switch (kind) {
    case 'service': {
      const main = await db.select().from(services).where(eq(services.id, entityId)).get()
      if (!main) return null
      const translations = await db.select().from(serviceTranslations).where(eq(serviceTranslations.serviceId, entityId)).all()
      return { kind, main: main as unknown as SnapshotRow, translations: translations as unknown as SnapshotRow[] }
    }
    case 'blog_post': {
      const main = await db.select().from(blogPosts).where(eq(blogPosts.id, entityId)).get()
      if (!main) return null
      const translations = await db.select().from(blogPostTranslations).where(eq(blogPostTranslations.postId, entityId)).all()
      return { kind, main: main as unknown as SnapshotRow, translations: translations as unknown as SnapshotRow[] }
    }
    case 'faq_item': {
      const main = await db.select().from(faqItems).where(eq(faqItems.id, entityId)).get()
      if (!main) return null
      const translations = await db.select().from(faqItemTranslations).where(eq(faqItemTranslations.faqItemId, entityId)).all()
      return { kind, main: main as unknown as SnapshotRow, translations: translations as unknown as SnapshotRow[] }
    }
    case 'page': {
      const main = await db.select().from(pages).where(eq(pages.id, entityId)).get()
      if (!main) return null
      const translations = await db.select().from(pageTranslations).where(eq(pageTranslations.pageId, entityId)).all()
      return { kind, main: main as unknown as SnapshotRow, translations: translations as unknown as SnapshotRow[] }
    }
    default:
      return null
  }
}

function slugFor(snapshot: RevisionSnapshot, locale: 'ru' | 'uk'): string {
  const tr = snapshot.translations.find((t) => t.locale === locale)
  return str(tr?.slug)
}

function featuredOf(main: SnapshotRow): boolean {
  const v = main.featured
  return typeof v === 'boolean' ? v : v === 1 || v === '1'
}

/**
 * Restore an entity to the state captured in a revision snapshot.
 * OWNER/ADMIN only. Before applying, the current (post-mutation) state is
 * itself captured as a safety revision so no state is ever lost.
 */
export async function restoreRevision(revisionId: string): Promise<{ ok: boolean }> {
  await requirePublish()
  const db = await getActionDb()
  const rev = await db.select().from(contentRevisions).where(eq(contentRevisions.id, revisionId)).get()
  if (!rev) throw new Error('Ревізію не знайдено')

  const kind = rev.entityType
  const entityId = rev.entityId ?? ''
  if (!kind || !entityId || !(kind in ENTITY_TYPE)) throw new Error('Не підтримуваний тип ревізії')
  const snapshot = loadSnapshot(rev.dataJson)

  // Safety: never lose the current state.
  const current = await readCurrentSnapshot(db, kind, entityId)
  if (current) {
    await captureSafety(db, kind, entityId, rev.createdById, current)
  }

  const updatedAt = nowStr()

  if (kind === 'service') {
    const main = serviceMainValues(snapshot.main)
    await db.update(services).set({ ...main, updatedAt }).where(eq(services.id, entityId))
    for (const tr of snapshot.translations) {
      const values = serviceTranslationTargetValues(tr)
      const trId = typeof tr.id === 'string' ? tr.id : ''
      const locale = localeOf(tr.locale)
      const byLocale = await db.select({ id: serviceTranslations.id }).from(serviceTranslations).where(eq(serviceTranslations.serviceId, entityId)).all()
      const target = trId ? byLocale.find((r) => r.id === trId) : undefined
      if (target) {
        await db.update(serviceTranslations).set(values).where(eq(serviceTranslations.id, target.id))
      } else {
        await db.insert(serviceTranslations).values({ id: trId, serviceId: entityId, locale, ...values })
      }
    }
  } else if (kind === 'blog_post') {
    const main = blogMainValues(snapshot.main)
    await db.update(blogPosts).set({ ...main, updatedAt }).where(eq(blogPosts.id, entityId))
    for (const tr of snapshot.translations) {
      const values = blogTranslationValues(tr)
      const trId = typeof tr.id === 'string' ? tr.id : ''
      const locale = localeOf(tr.locale)
      const byLocale = await db.select({ id: blogPostTranslations.id }).from(blogPostTranslations).where(eq(blogPostTranslations.postId, entityId)).all()
      const target = trId ? byLocale.find((r) => r.id === trId) : undefined
      if (target) {
        await db.update(blogPostTranslations).set(values).where(eq(blogPostTranslations.id, target.id))
      } else {
        await db.insert(blogPostTranslations).values({ id: trId, postId: entityId, locale, ...values })
      }
    }
  } else if (kind === 'faq_item') {
    const main = faqMainValues(snapshot.main)
    await db.update(faqItems).set(main).where(eq(faqItems.id, entityId))
    for (const tr of snapshot.translations) {
      const values = faqTranslationValues(tr)
      const trId = typeof tr.id === 'string' ? tr.id : ''
      const locale = localeOf(tr.locale)
      const byLocale = await db.select({ id: faqItemTranslations.id }).from(faqItemTranslations).where(eq(faqItemTranslations.faqItemId, entityId)).all()
      const target = trId ? byLocale.find((r) => r.id === trId) : undefined
      if (target) {
        await db.update(faqItemTranslations).set(values).where(eq(faqItemTranslations.id, target.id))
      } else {
        await db.insert(faqItemTranslations).values({ id: trId, faqItemId: entityId, locale, ...values })
      }
    }
  } else if (kind === 'page') {
    const main = pageMainValues(snapshot.main)
    await db.update(pages).set({ ...main, updatedAt }).where(eq(pages.id, entityId))
    for (const tr of snapshot.translations) {
      const values = pageTranslationValues(tr)
      const trId = typeof tr.id === 'string' ? tr.id : ''
      const locale = localeOf(tr.locale)
      const byLocale = await db.select({ id: pageTranslations.id }).from(pageTranslations).where(eq(pageTranslations.pageId, entityId)).all()
      const target = trId ? byLocale.find((r) => r.id === trId) : undefined
      if (target) {
        await db.update(pageTranslations).set(values).where(eq(pageTranslations.id, target.id))
      } else {
        await db.insert(pageTranslations).values({ id: trId, pageId: entityId, locale, ...values })
      }
    }
  } else {
    throw new Error('Не підтримуваний тип ревізії')
  }

  await writeAuditLog({
    userId: rev.createdById ?? '',
    action: 'UPDATE',
    entityType: ENTITY_TYPE[kind],
    entityId,
    after: { restoredFromRevision: revisionId },
  })

  // Full invalidation identical to the live update action for this entity kind.
  const ruSlug = slugFor(snapshot, 'ru')
  const ukSlug = slugFor(snapshot, 'uk')
  if (kind === 'service') {
    const featured = featuredOf(snapshot.main)
    revalidateAdmin('/admin/services')
    await revalidatePublic({
      paths: getServiceRevalidatePaths(ruSlug, ukSlug, featured),
      keys: getServiceCacheKeys(ruSlug, ukSlug, entityId, featured),
      prefixes: [cacheKeyPrefixes.serviceSlugPair],
    })
  } else if (kind === 'blog_post') {
    revalidateAdmin('/admin/blog/posts', `/admin/blog/posts/${entityId}`)
    await revalidatePublic({
      paths: getBlogPostRevalidatePaths(ruSlug, ukSlug),
      keys: getBlogPostCacheKeys(ruSlug, ukSlug, undefined, undefined, entityId),
      prefixes: [cacheKeyPrefixes.blogImages, cacheKeyPrefixes.blogSlugPair],
    })
  } else if (kind === 'faq_item') {
    revalidateAdmin('/admin/faq')
    await revalidatePublic({ paths: getFaqRevalidatePaths(), prefixes: [cacheKeyPrefixes.faq] })
  } else if (kind === 'page') {
    const type = str(snapshot.main.type)
    revalidateAdmin('/admin/pages', `/admin/pages/${entityId}`)
    await revalidatePublic({ paths: getPageRevalidatePaths(type), keys: getPageCacheKeys(type) })
  }

  return { ok: true }
}