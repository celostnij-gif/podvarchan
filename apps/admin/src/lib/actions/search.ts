'use server'

import { eq, sql, like, or } from 'drizzle-orm'
import {
  services, serviceTranslations,
  blogPosts, blogPostTranslations,
  pages, pageTranslations,
  faqItems, faqItemTranslations,
  contactLeads,
} from '@podvarchan/shared'
import { getCurrentUser } from '@/lib/auth/session'
import { canEditContent } from '@/lib/auth/permissions'
import { getActionDb } from './db'

export interface SearchResultItem {
  id: string
  type: 'service' | 'blog' | 'lead' | 'page' | 'faq'
  href: string
  label: string
  sublabel?: string
}

const LIMIT_PER_TYPE = 5

function q(term: string): string {
  return `%${term}%`
}

export async function adminSearch(query: string): Promise<{ success: boolean; data: SearchResultItem[] }> {
  try {
    const user = await getCurrentUser()
    if (!user || !canEditContent(user.role)) return { success: false, data: [] }
    if (!query || query.trim().length < 2) return { success: true, data: [] }

    const term = query.trim()
    const db = await getActionDb()
    const pattern = q(term)

    const [rawServiceResults, rawBlogResults, rawPageResults, rawFaqResults, leadResults] = await Promise.all([

      // ── Services ──
      db.select({
        id: services.id,
        title: serviceTranslations.title,
        description: serviceTranslations.description,
        heroTitle: serviceTranslations.heroTitle,
      })
        .from(services)
        .leftJoin(serviceTranslations, sql`${services.id} = ${serviceTranslations.serviceId}`)
        .where(
          or(
            like(serviceTranslations.title, pattern),
            like(serviceTranslations.description, pattern),
            like(serviceTranslations.heroTitle, pattern),
            like(serviceTranslations.heroSubtitle, pattern),
          ),
        )
        .all(),

      // ── Blog posts ──
      db.select({
        id: blogPosts.id,
        title: blogPostTranslations.title,
        excerpt: blogPostTranslations.excerpt,
      })
        .from(blogPosts)
        .leftJoin(blogPostTranslations, sql`${blogPosts.id} = ${blogPostTranslations.postId}`)
        .where(
          or(
            like(blogPostTranslations.title, pattern),
            like(blogPostTranslations.excerpt, pattern),
          ),
        )
        .all(),

      // ── Pages ──
      db.select({
        id: pages.id,
        title: pageTranslations.title,
        excerpt: pageTranslations.excerpt,
      })
        .from(pages)
        .leftJoin(pageTranslations, sql`${pages.id} = ${pageTranslations.pageId}`)
        .where(
          or(
            like(pageTranslations.title, pattern),
            like(pageTranslations.excerpt, pattern),
          ),
        )
        .all(),

      // ── FAQ ──
      db.select({
        id: faqItems.id,
        question: faqItemTranslations.question,
        answer: faqItemTranslations.answer,
      })
        .from(faqItems)
        .leftJoin(faqItemTranslations, sql`${faqItems.id} = ${faqItemTranslations.faqItemId}`)
        .where(
          or(
            like(faqItemTranslations.question, pattern),
            like(faqItemTranslations.answer, pattern),
          ),
        )
        .all(),

      // ── Leads ──
      db.select({
        id: contactLeads.id,
        name: contactLeads.name,
        email: contactLeads.email,
        phone: contactLeads.phone,
        message: contactLeads.message,
      })
        .from(contactLeads)
        .where(
          or(
            like(contactLeads.name, pattern),
            like(contactLeads.email, pattern),
            like(contactLeads.phone, pattern),
            like(contactLeads.message, pattern),
          ),
        )
        .all(),
    ])

    // Deduplicate by entity ID (locale join can produce duplicates)
    function dedup<T extends { id: string }>(rows: T[]): T[] {
      const seen = new Set<string>()
      return rows.filter((r) => {
        if (seen.has(r.id)) return false
        seen.add(r.id)
        return true
      })
    }

    const serviceResults = dedup(rawServiceResults).slice(0, LIMIT_PER_TYPE)
    const blogResults = dedup(rawBlogResults).slice(0, LIMIT_PER_TYPE)
    const pageResults = dedup(rawPageResults).slice(0, LIMIT_PER_TYPE)
    const faqResults = dedup(rawFaqResults).slice(0, LIMIT_PER_TYPE)

    const data: SearchResultItem[] = [
      ...serviceResults.map((r) => ({
        id: r.id,
        type: 'service' as const,
        href: `/admin/services/${r.id}`,
        label: r.title ?? r.heroTitle ?? r.description ?? '—',
        sublabel: 'Услуга',
      })),
      ...blogResults.map((r) => ({
        id: r.id,
        type: 'blog' as const,
        href: `/admin/blog/posts/${r.id}`,
        label: r.title ?? r.excerpt ?? '—',
        sublabel: 'Статья',
      })),
      ...pageResults.map((r) => ({
        id: r.id,
        type: 'page' as const,
        href: `/admin/pages/${r.id}`,
        label: r.title ?? r.excerpt ?? '—',
        sublabel: 'Страница',
      })),
      ...faqResults.map((r) => ({
        id: r.id,
        type: 'faq' as const,
        href: `/admin/faq/${r.id}`,
        label: r.question ?? r.answer ?? '—',
        sublabel: 'FAQ',
      })),
      ...leadResults.map((r) => ({
        id: r.id,
        type: 'lead' as const,
        href: `/admin/leads/${r.id}`,
        label: r.name ?? r.email ?? r.phone ?? r.message ?? '—',
        sublabel: 'Заявка',
      })),
    ]

    return { success: true, data }
  } catch {
    return { success: false, data: [] }
  }
}

/** @deprecated use adminSearch */
export const searchAdmin = adminSearch

export async function getNewLeadCount(): Promise<{ success: boolean; data: number }> {
  const user = await getCurrentUser()
  if (!user || !canEditContent(user.role)) return { success: false, data: 0 }
  try {
    const db = await getActionDb()
    const result = await db.select({ count: sql<number>`count(*)` }).from(contactLeads).where(eq(contactLeads.status, 'NEW')).get()
    return { success: true, data: result?.count ?? 0 }
  } catch {
    return { success: false, data: 0 }
  }
}
