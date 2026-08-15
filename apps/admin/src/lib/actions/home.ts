'use server'

/**
 * Home Studio server actions — atomic per-zone save.
 *
 * Blueprint is the source of truth for zone keys, schemas, and defaults.
 * All writes are zone-scoped; no full-page overwrite ever happens.
 */

import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { getActionDb } from './db'
import { requireAdminSession } from '@/lib/auth/session'
import { canEditContent } from '@/lib/auth/permissions'
import { revalidatePublic, revalidateAdmin, getHomeRevalidatePaths } from '@/lib/revalidate'
import { writeAuditLog } from '@/lib/audit/log'
import {
  pages,
  pageTranslations,
  pageSections,
  pageSectionTranslations,
  seoMeta,
} from '@podvarchan/shared'
import {
  HOME_ZONE_KEYS,
  HOME_ZONE_META,
  HOME_DEFAULTS,
  type HomeZoneKey,
  type HeroContent,
} from '@/lib/home/blueprint'

/* ── Auth helper ── */

async function requireEdit(): Promise<string> {
  const session = await requireAdminSession()
  if (!canEditContent(session.user.role)) throw new Error('Недостатньо прав')
  return session.user.id
}

/* ── H0: ensureHomeBlueprint ── */

/**
 * Create missing sections + translations for every zone in the blueprint.
 * Idempotent — existing sections are skipped.
 *
 * Returns { created: number } for UI feedback.
 */
export async function ensureHomeBlueprint(): Promise<{ created: number }> {
  const userId = await requireEdit()
  const db = await getActionDb()

  const home = await db.select().from(pages).where(eq(pages.type, 'HOME')).get()
  if (!home) throw new Error('HOME page not found in D1')

  let created = 0

  for (const key of HOME_ZONE_KEYS) {
    const meta = HOME_ZONE_META[key]

    // Check if section with this key already exists
    const existing = await db
      .select()
      .from(pageSections)
      .where(and(eq(pageSections.pageId, home.id), eq(pageSections.key, key)))
      .get()

    if (!existing) {
      // Create section
      const sectionId = crypto.randomUUID()
      await db.insert(pageSections).values({
        id: sectionId,
        pageId: home.id,
        key,
        type: meta.type,
        enabled: meta.defaultEnabled,
        sortOrder: meta.sortOrder,
        settingsJson: null,
      })

      // Create translations for both locales
      const defaultContent = JSON.stringify(HOME_DEFAULTS[key])
      for (const locale of ['ru', 'uk'] as const) {
        await db.insert(pageSectionTranslations).values({
          id: crypto.randomUUID(),
          sectionId,
          locale,
          contentJson: defaultContent,
        })
      }

      created++
    } else {
      // Section exists — ensure both locale translations exist
      for (const locale of ['ru', 'uk'] as const) {
        const tr = await db
          .select()
          .from(pageSectionTranslations)
          .where(
            and(
              eq(pageSectionTranslations.sectionId, existing.id),
              eq(pageSectionTranslations.locale, locale),
            ),
          )
          .get()

        if (!tr) {
          await db.insert(pageSectionTranslations).values({
            id: crypto.randomUUID(),
            sectionId: existing.id,
            locale,
            contentJson: JSON.stringify(HOME_DEFAULTS[key]),
          })
          created++
        }
      }
    }
  }

  // Also ensure seo_meta rows exist for both locales
  const ruTr = await db
    .select()
    .from(pageTranslations)
    .where(and(eq(pageTranslations.pageId, home.id), eq(pageTranslations.locale, 'ru')))
    .get()

  const ukTr = await db
    .select()
    .from(pageTranslations)
    .where(and(eq(pageTranslations.pageId, home.id), eq(pageTranslations.locale, 'uk')))
    .get()

  for (const tr of [ruTr, ukTr].filter(Boolean)) {
    if (tr && !tr.seoMetaId) {
      const metaId = crypto.randomUUID()
      await db.insert(seoMeta).values({
        id: metaId,
        entityType: 'page',
        entityId: home.id,
        locale: tr.locale as 'ru' | 'uk',
        title: null,
        description: null,
        keywords: null,
        canonicalPath: tr.locale === 'ru' ? '/' : '/uk/',
        ogTitle: null,
        ogDescription: null,
        ogImageId: null,
        robotsIndex: true,
        robotsFollow: true,
        schemaType: 'WebPage',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      await db
        .update(pageTranslations)
        .set({ seoMetaId: metaId })
        .where(eq(pageTranslations.id, tr.id))
    }
  }

  await writeAuditLog({
    userId,
    action: 'UPDATE',
    entityType: 'HOME_BLUEPRINT',
    entityId: home.id,
    after: { created, zones: HOME_ZONE_KEYS.length },
  })

  revalidateAdmin('/admin/home')

  return { created }
}

/* ── H5: updateHomeMeta ── */

const homeMetaSchema = z.object({
  locale: z.enum(['ru', 'uk']),
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
})

export async function updateHomeMeta(input: z.infer<typeof homeMetaSchema>): Promise<{ ok: boolean }> {
  const userId = await requireEdit()
  const parsed = homeMetaSchema.parse(input)
  const db = await getActionDb()

  const home = await db.select().from(pages).where(eq(pages.type, 'HOME')).get()
  if (!home) throw new Error('HOME page not found')

  const tr = await db
    .select()
    .from(pageTranslations)
    .where(and(eq(pageTranslations.pageId, home.id), eq(pageTranslations.locale, parsed.locale)))
    .get()
  if (!tr) throw new Error(`${parsed.locale} translation not found`)

  // Upsert seo_meta
  if (tr.seoMetaId) {
    await db
      .update(seoMeta)
      .set({
        title: parsed.title ?? undefined,
        description: parsed.description ?? undefined,
        keywords: parsed.keywords ?? undefined,
        ogTitle: parsed.ogTitle ?? undefined,
        ogDescription: parsed.ogDescription ?? undefined,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(seoMeta.id, tr.seoMetaId))
  } else {
    const metaId = crypto.randomUUID()
    await db.insert(seoMeta).values({
      id: metaId,
      entityType: 'page',
      entityId: home.id,
      locale: parsed.locale,
      title: parsed.title ?? null,
      description: parsed.description ?? null,
      keywords: parsed.keywords ?? null,
      canonicalPath: parsed.locale === 'ru' ? '/' : '/uk/',
      ogTitle: parsed.ogTitle ?? null,
      ogDescription: parsed.ogDescription ?? null,
      ogImageId: null,
      robotsIndex: true,
      robotsFollow: true,
      schemaType: 'WebPage',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    await db
      .update(pageTranslations)
      .set({ seoMetaId: metaId })
      .where(eq(pageTranslations.id, tr.id))
  }

  await writeAuditLog({
    userId,
    action: 'UPDATE',
    entityType: 'SEO_META',
    entityId: tr.seoMetaId ?? home.id,
    after: { locale: parsed.locale, title: parsed.title },
  })

  revalidateAdmin('/admin/home')
  void revalidatePublic({ paths: getHomeRevalidatePaths() })

  return { ok: true }
}

/* ── H4: updateHomeZone ── */
const updateZoneSchema = z.object({
  zone: z.enum(HOME_ZONE_KEYS),
  locale: z.enum(['ru', 'uk']),
  content: z.record(z.unknown()),
  settings: z.record(z.unknown()).optional(),
})

export async function updateHomeZone(
  input: z.infer<typeof updateZoneSchema>,
): Promise<{ ok: boolean; heroSynced?: boolean }> {
  const userId = await requireEdit()
  const parsed = updateZoneSchema.parse(input)
  const db = await getActionDb()

  const home = await db.select().from(pages).where(eq(pages.type, 'HOME')).get()
  if (!home) throw new Error('HOME page not found')

  const section = await db
    .select()
    .from(pageSections)
    .where(and(eq(pageSections.pageId, home.id), eq(pageSections.key, parsed.zone)))
    .get()
  if (!section) throw new Error(`Zone "${parsed.zone}" not found — run ensureHomeBlueprint`)

  // Serialize content
  const contentJson = JSON.stringify(parsed.content)
  const settingsJson = parsed.settings ? JSON.stringify(parsed.settings) : undefined

  // Update section settings if provided
  if (settingsJson !== undefined) {
    await db
      .update(pageSections)
      .set({ settingsJson })
      .where(eq(pageSections.id, section.id))
  }
  // Update section translation for specified locale only
  const locale = parsed.locale
  const existingTr = await db
    .select()
    .from(pageSectionTranslations)
    .where(
      and(
        eq(pageSectionTranslations.sectionId, section.id),
        eq(pageSectionTranslations.locale, locale),
      ),
    )
    .get()

  if (existingTr) {
    await db
      .update(pageSectionTranslations)
      .set({ contentJson })
      .where(eq(pageSectionTranslations.id, existingTr.id))
  } else {
    await db.insert(pageSectionTranslations).values({
      id: crypto.randomUUID(),
      sectionId: section.id,
      locale,
      contentJson,
    })
  }

  // Hero dual-write: sync section hero → page_translations.title/excerpt
  let heroSynced = false
  if (parsed.zone === 'hero') {
    const heroContent = parsed.content as Partial<HeroContent>
    const title = heroContent.title ?? ''
    const excerpt = heroContent.subtitle ?? ''

    const tr = await db
      .select()
      .from(pageTranslations)
      .where(and(eq(pageTranslations.pageId, home.id), eq(pageTranslations.locale, parsed.locale)))
      .get()

    if (tr) {
      await db
        .update(pageTranslations)
        .set({ title, excerpt })
        .where(eq(pageTranslations.id, tr.id))
    }
    heroSynced = true
  }

  await writeAuditLog({
    userId,
    action: 'UPDATE',
    entityType: 'HOME_ZONE',
    entityId: section.id,
    after: { zone: parsed.zone, contentLength: contentJson.length },
  })

  revalidateAdmin('/admin/home', '/admin/pages')
  void revalidatePublic({ paths: getHomeRevalidatePaths() })

  return { ok: true, heroSynced }
}

/* ── H4: toggleHomeZone ── */

export async function toggleHomeZone(zone: HomeZoneKey): Promise<{ ok: boolean; enabled: boolean }> {
  const userId = await requireEdit()
  const db = await getActionDb()

  const home = await db.select().from(pages).where(eq(pages.type, 'HOME')).get()
  if (!home) throw new Error('HOME page not found')

  const section = await db
    .select()
    .from(pageSections)
    .where(and(eq(pageSections.pageId, home.id), eq(pageSections.key, zone)))
    .get()
  if (!section) throw new Error(`Zone "${zone}" not found`)

  const newEnabled = !section.enabled
  await db
    .update(pageSections)
    .set({ enabled: newEnabled })
    .where(eq(pageSections.id, section.id))

  await writeAuditLog({
    userId,
    action: 'UPDATE',
    entityType: 'HOME_ZONE',
    entityId: section.id,
    after: { zone, enabled: newEnabled },
  })

  revalidateAdmin('/admin/home')
  void revalidatePublic({ paths: getHomeRevalidatePaths() })

  return { ok: true, enabled: newEnabled }
}
