'use server'

/**
 * Server Actions для адмінського пошуку (Command Palette).
 */

import { getActionDb } from './db'
import { ok, fail } from './result'
import { withAuth } from './guard'
import { sql, eq, desc } from 'drizzle-orm'
import * as s from '@/db/schema'

/* ── Types ── */

export interface SearchResultItem {
  id: string
  type: 'service' | 'blog' | 'lead' | 'page' | 'faq'
  label: string
  sublabel: string
  href: string
  icon?: string
}

/* ── Search action ── */

export const searchAdmin = withAuth(async (_session, ...args) => {
  try {
    const db = getActionDb()
    const query = ((args[0] as string) ?? '').trim().toLowerCase()

    const results: SearchResultItem[] = []

    // ── Services ──
    const services = await db
      .select({
        id: s.services.id,
        slugBase: s.services.slugBase,
        status: s.services.status,
        translations: s.serviceTranslations,
      })
      .from(s.services)
      .leftJoin(s.serviceTranslations, eq(s.services.id, s.serviceTranslations.serviceId))
      .orderBy(desc(s.services.updatedAt))
      .limit(10)

    for (const svc of services) {
      if (!svc.translations) continue
      const title = svc.translations.title?.toLowerCase() ?? ''
      const slug = svc.translations.slug?.toLowerCase() ?? ''
      if (!query || title.includes(query) || slug.includes(query) || svc.slugBase.includes(query)) {
        results.push({
          id: svc.id,
          type: 'service',
          label: svc.translations.title ?? svc.slugBase,
          sublabel: `Услуга • ${svc.status}`,
          href: `/admin/services/${svc.id}`,
        })
      }
    }

    // ── Blog posts ──
    const posts = await db
      .select({
        id: s.blogPosts.id,
        status: s.blogPosts.status,
        translations: s.blogPostTranslations,
      })
      .from(s.blogPosts)
      .leftJoin(s.blogPostTranslations, eq(s.blogPosts.id, s.blogPostTranslations.postId))
      .orderBy(desc(s.blogPosts.updatedAt))
      .limit(10)

    for (const post of posts) {
      if (!post.translations) continue
      const title = post.translations.title?.toLowerCase() ?? ''
      const slug = post.translations.slug?.toLowerCase() ?? ''
      if (!query || title.includes(query) || slug.includes(query)) {
        results.push({
          id: post.id,
          type: 'blog',
          label: post.translations.title ?? post.id.slice(0, 8),
          sublabel: `Статья • ${post.status}`,
          href: `/admin/blog/${post.id}`,
        })
      }
    }

    // ── Leads ──
    const leads = await db
      .select({
        id: s.contactLeads.id,
        name: s.contactLeads.name,
        email: s.contactLeads.email,
        status: s.contactLeads.status,
      })
      .from(s.contactLeads)
      .orderBy(desc(s.contactLeads.createdAt))
      .limit(10)

    for (const lead of leads) {
      const name = lead.name.toLowerCase()
      const email = lead.email.toLowerCase()
      if (!query || name.includes(query) || email.includes(query)) {
        results.push({
          id: lead.id,
          type: 'lead',
          label: lead.name,
          sublabel: `Заявка • ${lead.email} • ${lead.status}`,
          href: `/admin/leads/${lead.id}`,
        })
      }
    }

    // ── Pages (static pages from DB) ──
    const pages = await db
      .select({
        id: s.pages.id,
        type: s.pages.type,
        status: s.pages.status,
        translations: s.pageTranslations,
      })
      .from(s.pages)
      .leftJoin(s.pageTranslations, eq(s.pages.id, s.pageTranslations.pageId))
      .orderBy(desc(s.pages.updatedAt))
      .limit(10)

    for (const page of pages) {
      if (!page.translations) continue
      const title = page.translations.title?.toLowerCase() ?? page.type.toLowerCase()
      if (!query || title.includes(query)) {
        results.push({
          id: page.id,
          type: 'page',
          label: page.translations.title ?? page.type,
          sublabel: `Страница • ${page.status}`,
          href: `/admin/pages/${page.id}`,
        })
      }
    }

    // Deduplicate by id (left join with translations produces duplicate rows)
    const seen = new Set<string>()
    const deduped = results.filter((item) => {
      if (seen.has(item.id)) return false
      seen.add(item.id)
      return true
    })

    return ok(deduped.slice(0, 50))
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Помилка пошуку')
  }
})

/* ── Get lead count for badge ── */

export const getNewLeadCount = withAuth(async (_session) => {
  try {
    const db = getActionDb()
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(s.contactLeads)
      .where(eq(s.contactLeads.status, 'NEW'))

    return ok(result?.count ?? 0)
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Помилка отримання кількості заявок')
  }
})
