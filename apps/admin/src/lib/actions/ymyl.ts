import { eq } from 'drizzle-orm'
import { seoMeta } from '@podvarchan/shared'
import { getCurrentUser } from '@/lib/auth/session'
import { canPublish } from '@/lib/auth/permissions'
import type { ActionDb } from './db'

/**
 * Publish rejection with a stable machine-readable code and a human-readable
 * reason (P1-3). The reason is what surfaces to the admin in the UI toast, so
 * "why can't I publish?" is answered instead of a generic error message.
 */
export class PublishValidationError extends Error {
  readonly code: string
  readonly reason: string

  constructor(code: string, reason: string) {
    super(reason)
    this.name = 'PublishValidationError'
    this.code = code
    this.reason = reason
  }
}

export type PublishFailure =
  | { code: 'FORBIDDEN'; reason: string }
  | { code: 'RU_INCOMPLETE'; reason: string }
  | { code: 'UK_INCOMPLETE'; reason: string }
  | { code: 'META_MISSING'; reason: string }
  | { code: 'CONSENT_MISSING'; reason: string }

export function publishFailure(failure: PublishFailure): never {
  throw new PublishValidationError(failure.code, failure.reason)
}

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
    publishFailure({ code: 'FORBIDDEN', reason: 'Лише ВЛАСНИК або АДМІН можуть публікувати' })
  }
}

/** Throws if either RU or UK translation lacks a non-empty title + slug. */
export function assertBilingual(
  ru: YmylTranslation | undefined,
  uk: YmylTranslation | undefined,
  label: string,
): void {
  if (!ru?.title || !ru?.slug) {
    publishFailure({ code: 'RU_INCOMPLETE', reason: `${label}: RU переклад повинен мати непорожній заголовок та slug` })
  }
  if (!uk?.title || !uk?.slug) {
    publishFailure({ code: 'UK_INCOMPLETE', reason: `${label}: UK переклад повинен мати непорожній заголовок та slug` })
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
    publishFailure({
      code: 'META_MISSING',
      reason: `${label}: повинен мати мета-опис (seo_meta.description або excerpt/description ≥ 50 символів)`,
    })
  }
}
