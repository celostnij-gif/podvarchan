import { eq } from 'drizzle-orm'
import { seoMeta } from '@podvarchan/shared'
import { getCurrentUser } from '@/lib/auth/session'
import { canPublish } from '@/lib/auth/permissions'
import type { ActionDb } from './db'

export interface YmylTranslation {
  title?: string | null
  slug?: string | null
  excerpt?: string | null
  description?: string | null
  seoMetaId?: string | null
}

/** Throws unless the current user is OWNER or ADMIN. */
export async function requirePublish(): Promise<void> {
  const user = await getCurrentUser()
  if (!user || !canPublish(user.role)) {
    throw new Error('Only OWNER or ADMIN can publish')
  }
}

/** Throws if either RU or UK translation lacks a non-empty title + slug. */
export function assertBilingual(
  ru: YmylTranslation | undefined,
  uk: YmylTranslation | undefined,
  label: string,
): void {
  if (!ru?.title || !ru?.slug) {
    throw new Error(`${label}: RU translation must have a non-empty title and slug`)
  }
  if (!uk?.title || !uk?.slug) {
    throw new Error(`${label}: UK translation must have a non-empty title and slug`)
  }
}

/**
 * Throws if the RU translation has neither a stored meta description
 * (seo_meta.description) nor a long enough inline meta text
 * (excerpt for blog/page, description for service, >= 50 chars).
 */
export async function assertMetaPresent(
  ru: YmylTranslation,
  db: ActionDb,
  label: string,
): Promise<void> {
  let metaDesc: string | null = null
  if (ru.seoMetaId) {
    const meta = await db
      .select({ description: seoMeta.description })
      .from(seoMeta)
      .where(eq(seoMeta.id, ru.seoMetaId))
      .get()
    metaDesc = meta?.description ?? null
  }
  const metaText = ru.excerpt ?? ru.description ?? ''
  const hasLongMeta = metaText.length >= 50
  if (!metaDesc && !hasLongMeta) {
    throw new Error(
      `${label}: must have a meta description (seo_meta.description or excerpt/description ≥ 50 chars)`,
    )
  }
}
