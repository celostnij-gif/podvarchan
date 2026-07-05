'use server'

import { getDB } from '@/db'
import { seoMeta } from '@/db/schema/seo'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { runSeoAudit } from '@/lib/seo/audit'
import type { SeoUrlRow } from '@/lib/seo/audit'

function uid(): string {
  return randomUUID()
}

/** Fetch audit data for the admin table. */
export async function getSeoAudit(): Promise<SeoUrlRow[]> {
  return runSeoAudit()
}

/** Save SEO override for a specific entity. */
export async function saveSeoOverride(formData: FormData) {
  const entityType = formData.get('entityType') as string
  const entityId = formData.get('entityId') as string
  const locale = formData.get('locale') as 'ru' | 'uk'
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const keywords = formData.get('keywords') as string
  const canonicalPath = formData.get('canonicalPath') as string
  const ogTitle = formData.get('ogTitle') as string
  const ogDescription = formData.get('ogDescription') as string
  const robotsIndex = formData.get('robotsIndex') === 'true'
  const robotsFollow = formData.get('robotsFollow') === 'true'

  const db = getDB()
  const now = new Date().toISOString()

  // Upsert
  const existing = await db
    .select()
    .from(seoMeta)
    .where(and(eq(seoMeta.entityType, entityType), eq(seoMeta.entityId, entityId), eq(seoMeta.locale, locale)))
    .get()

  if (existing) {
    await db
      .update(seoMeta)
      .set({
        title: title || null,
        description: description || null,
        keywords: keywords || null,
        canonicalPath: canonicalPath || null,
        ogTitle: ogTitle || null,
        ogDescription: ogDescription || null,
        robotsIndex,
        robotsFollow,
        updatedAt: now,
      })
      .where(eq(seoMeta.id, existing.id))
  } else {
    await db.insert(seoMeta).values({
      id: uid(),
      entityType,
      entityId,
      locale,
      title: title || null,
      description: description || null,
      keywords: keywords || null,
      canonicalPath: canonicalPath || null,
      ogTitle: ogTitle || null,
      ogDescription: ogDescription || null,
      robotsIndex,
      robotsFollow,
      createdAt: now,
      updatedAt: now,
    })
  }

  revalidatePath('/admin/seo')
  revalidatePath(`/admin/seo/${entityType}/${entityId}`)
}

/** Get SEO override for a specific entity. */
export async function getSeoOverride(entityType: string, entityId: string, locale: string) {
  const db = getDB()
  return db
    .select()
    .from(seoMeta)
    .where(and(eq(seoMeta.entityType, entityType), eq(seoMeta.entityId, entityId), eq(seoMeta.locale, locale as 'ru' | 'uk')))
    .get()
}

/** Bulk update SEO fields for multiple entities. */
export async function bulkUpdateSeo(formData: FormData) {
  const idsJson = formData.get('ids') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const robotsIndex = formData.get('robotsIndex') as string
  const robotsFollow = formData.get('robotsFollow') as string

  const ids = JSON.parse(idsJson) as { entityType: string; entityId: string; locale: string }[]
  const db = getDB()
  const now = new Date().toISOString()

  for (const { entityType, entityId, locale } of ids) {
    const existing = await db
      .select()
      .from(seoMeta)
      .where(and(eq(seoMeta.entityType, entityType), eq(seoMeta.entityId, entityId), eq(seoMeta.locale, locale as 'ru' | 'uk')))
      .get()

    if (existing) {
      await db
        .update(seoMeta)
        .set({
          title: title || existing.title,
          description: description || existing.description,
          robotsIndex: robotsIndex ? robotsIndex === 'true' : existing.robotsIndex,
          robotsFollow: robotsFollow ? robotsFollow === 'true' : existing.robotsFollow,
          updatedAt: now,
        })
        .where(eq(seoMeta.id, existing.id))
    } else {
      await db.insert(seoMeta).values({
        id: uid(),
        entityType,
        entityId,
        locale: locale as 'ru' | 'uk',
        title: title || null,
        description: description || null,
        robotsIndex: robotsIndex ? robotsIndex === 'true' : true,
        robotsFollow: robotsFollow ? robotsFollow === 'true' : true,
        createdAt: now,
        updatedAt: now,
      })
    }
  }

  revalidatePath('/admin/seo')
}

/** Generate CSV of audit data. */
export async function exportSeoCsv(): Promise<string> {
  const rows = await runSeoAudit()

  const header = 'URL,Locale,Type,Title,Description,H1,Word Count,Score,Warnings'
  const lines = rows.map((r) => {
    const warnings = r.warnings.join('; ')
    return [
      r.url,
      r.locale,
      r.entityType,
      `"${(r.title ?? '').replace(/"/g, '""')}"`,
      `"${(r.description ?? '').replace(/"/g, '""')}"`,
      `"${(r.h1 ?? '').replace(/"/g, '""')}"`,
      r.wordCount,
      r.score,
      `"${warnings.replace(/"/g, '""')}"`,
    ].join(',')
  })

  return [header, ...lines].join('\n')
}
