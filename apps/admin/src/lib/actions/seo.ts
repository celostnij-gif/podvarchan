'use server'

import { revalidatePath } from 'next/cache'
import { eq, and } from 'drizzle-orm'
import { seoMeta } from '@podvarchan/shared'
import { getCurrentUser } from '@/lib/auth/session'
import { canEditContent } from '@/lib/auth/permissions'
import { getActionDb } from './db'
import { writeAuditLog } from '@/lib/audit/log'
import { runSeoAudit } from '@/lib/seo/audit'
import { revalidatePublic, revalidateAdmin, getHomeRevalidatePaths } from '@/lib/revalidate'
import type { SeoUrlRow } from '@/lib/seo/audit'

async function requireEdit(): Promise<string> {
  const user = await getCurrentUser()
  if (!user || !canEditContent(user.role)) throw new Error('Forbidden')
  return user.id
}

/* ── SEO meta overrides per entity (used by seo/[entityType]/[entityId]) ── */

export async function getSeoOverride(entityType: string, entityId: string, locale: string) {
  const db = await getActionDb()
  return db.select().from(seoMeta)
    .where(and(eq(seoMeta.entityType, entityType), eq(seoMeta.entityId, entityId), eq(seoMeta.locale, locale as 'ru' | 'uk')))
    .get()
}

export async function bulkUpdateSeo(formData: FormData) {
  const userId = await requireEdit()
  const db = await getActionDb()
  const idsJson = formData.get('ids') as string | null
  if (!idsJson) throw new Error('No IDs provided')
  const ids: { entityType: string; entityId: string; locale: string }[] = JSON.parse(idsJson)
  const title = formData.get('title') as string | null
  const description = formData.get('description') as string | null
  const ts = new Date().toISOString()

  for (const { entityType, entityId, locale } of ids) {
    const existing = await db.select().from(seoMeta)
      .where(and(eq(seoMeta.entityType, entityType), eq(seoMeta.entityId, entityId), eq(seoMeta.locale, locale as 'ru' | 'uk'))).get()
    const updates: Record<string, unknown> = { updatedAt: ts }
    if (title !== null) updates.title = title
    if (description !== null) updates.description = description
    if (existing) {
      await db.update(seoMeta).set(updates).where(eq(seoMeta.id, existing.id))
    } else {
      await db.insert(seoMeta).values({
        id: crypto.randomUUID(), entityType, entityId, locale: locale as 'ru' | 'uk',
        title, description, createdAt: ts, updatedAt: ts,
      })
    }
  }
  await writeAuditLog({ userId, action: 'UPDATE', entityType: 'SEO_META', entityId: 'bulk', after: { ids } })
  revalidatePath('/admin/seo')
}

/* ── Audit (SEO audit table) ── */

export async function getSeoAudit(): Promise<SeoUrlRow[]> {
  return runSeoAudit()
}

/* ── Save SEO override for a specific entity ── */

export async function saveSeoOverride(formData: FormData) {
  const userId = await requireEdit()
  const db = await getActionDb()
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
  const ts = new Date().toISOString()

  const existing = await db
    .select()
    .from(seoMeta)
    .where(and(eq(seoMeta.entityType, entityType), eq(seoMeta.entityId, entityId), eq(seoMeta.locale, locale)))
    .get()

  if (existing) {
    await db
      .update(seoMeta)
      .set({
        title: title || null, description: description || null,
        keywords: keywords || null, canonicalPath: canonicalPath || null,
        ogTitle: ogTitle || null, ogDescription: ogDescription || null,
        robotsIndex, robotsFollow, updatedAt: ts,
      })
      .where(eq(seoMeta.id, existing.id))
  } else {
    await db.insert(seoMeta).values({
      id: crypto.randomUUID(), entityType, entityId, locale,
      title: title || null, description: description || null,
      keywords: keywords || null, canonicalPath: canonicalPath || null,
      ogTitle: ogTitle || null, ogDescription: ogDescription || null,
      robotsIndex, robotsFollow, createdAt: ts, updatedAt: ts,
    })
  }

  revalidateAdmin('/admin/seo', `/admin/seo/${entityType}/${entityId}`)
  if (entityType.startsWith('service')) {
    void revalidatePublic({ paths: ['/ru/uslugi/', '/uk/uslugi/', '/sitemap.xml'], type: 'layout' })
  } else if (entityType.startsWith('blog')) {
    void revalidatePublic({ paths: ['/ru/blog/', '/uk/blog/', '/sitemap.xml'], type: 'layout' })
  } else if (entityType === 'page') {
    void revalidatePublic({ paths: getHomeRevalidatePaths() })
  }

  await writeAuditLog({ userId, action: 'UPDATE', entityType: 'SEO_META', entityId, after: { title, description, keywords } })
}

/* ── Export SEO audit to CSV ── */

export async function exportSeoCsv(): Promise<string> {
  const rows = await runSeoAudit()
  const header = 'URL,Locale,Type,Title,Description,H1,Word Count,Score,Warnings'
  const lines = rows.map((r) => {
    const warnings = r.warnings.join('; ')
    return [
      r.url, r.locale, r.entityType,
      `"${(r.title ?? '').replace(/"/g, '""')}"`,
      `"${(r.description ?? '').replace(/"/g, '""')}"`,
      `"${(r.h1 ?? '').replace(/"/g, '""')}"`,
      r.wordCount, r.score,
      `"${warnings.replace(/"/g, '""')}"`,
    ].join(',')
  })
  return [header, ...lines].join('\n')
}
