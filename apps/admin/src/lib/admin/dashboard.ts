'use server'

import { eq, sql, desc } from 'drizzle-orm'
import {
  services, serviceTranslations,
  blogPosts, blogPostTranslations,
  contactLeads, testimonials, mediaAssets,
  faqItems, faqItemTranslations,
  pages, pageTranslations,
  users, redirectRules, contentRevisions,
} from '@podvarchan/shared'
import { getCurrentUser } from '@/lib/auth/session'
import { canEditContent } from '@/lib/auth/permissions'
import { getActionDb } from '@/lib/actions/db'

export interface DashboardData {
  dbAvailable: boolean
  stats: {
    services: { total: number; published: number }
    blog: { total: number; published: number }
    leads: { total: number; new: number }
    testimonials: { total: number; published: number }
    faq: { total: number; published: number }
    media: { total: number }
    users: { total: number; active: number }
    redirects: { total: number }
    revisions: { total: number }
  }
  recentLeads: { id: string; name: string | null; email: string | null; phone: string | null; serviceName: string | null }[]
  drafts: { id: string; titleRu: string | null; type: string }[]
}

export async function getDashboardData(): Promise<DashboardData> {
  const user = await getCurrentUser()
  if (!user || !canEditContent(user.role)) throw new Error('Forbidden')
  const db = await getActionDb()

  try {
    const [
      servicesCount, publishedServices,
      postsCount, publishedPosts,
      leadsCount, newLeads,
      testimonialsCount, publishedTestimonials,
      faqCount, publishedFaq,
      mediaCount,
      usersCount, activeUsers,
      redirectsCount,
      revisionsCount,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(services).get(),
      db.select({ count: sql<number>`count(*)` }).from(services).where(eq(services.status, 'PUBLISHED')).get(),
      db.select({ count: sql<number>`count(*)` }).from(blogPosts).get(),
      db.select({ count: sql<number>`count(*)` }).from(blogPosts).where(eq(blogPosts.status, 'PUBLISHED')).get(),
      db.select({ count: sql<number>`count(*)` }).from(contactLeads).get(),
      db.select({ count: sql<number>`count(*)` }).from(contactLeads).where(eq(contactLeads.status, 'NEW')).get(),
      db.select({ count: sql<number>`count(*)` }).from(testimonials).get(),
      db.select({ count: sql<number>`count(*)` }).from(testimonials).where(eq(testimonials.status, 'PUBLISHED')).get(),
      db.select({ count: sql<number>`count(*)` }).from(faqItems).get(),
      db.select({ count: sql<number>`count(*)` }).from(faqItems).where(eq(faqItems.status, 'PUBLISHED')).get(),
      db.select({ count: sql<number>`count(*)` }).from(mediaAssets).get(),
      db.select({ count: sql<number>`count(*)` }).from(users).get(),
      db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.isActive, true)).get(),
      db.select({ count: sql<number>`count(*)` }).from(redirectRules).get(),
      db.select({ count: sql<number>`count(*)` }).from(contentRevisions).get(),
    ])

    const recentLeads = await db.select({
      id: contactLeads.id, name: contactLeads.name, email: contactLeads.email, phone: contactLeads.phone,
    }).from(contactLeads).orderBy(desc(contactLeads.createdAt)).limit(5)

    // ---- Draft queries ----

    const [
      serviceDrafts,
      postDrafts,
      pageDrafts,
      faqDrafts,
    ] = await Promise.all([
      db.select({
        id: services.id,
        titleRu: serviceTranslations.title,
      }).from(services)
        .leftJoin(serviceTranslations, sql`${services.id} = ${serviceTranslations.serviceId} AND ${serviceTranslations.locale} = 'ru'`)
        .where(eq(services.status, 'DRAFT'))
        .orderBy(desc(services.updatedAt))
        .limit(10)
        .all(),

      db.select({
        id: blogPosts.id,
        titleRu: blogPostTranslations.title,
      }).from(blogPosts)
        .leftJoin(blogPostTranslations, sql`${blogPosts.id} = ${blogPostTranslations.postId} AND ${blogPostTranslations.locale} = 'ru'`)
        .where(eq(blogPosts.status, 'DRAFT'))
        .orderBy(desc(blogPosts.updatedAt))
        .limit(10)
        .all(),

      db.select({
        id: pages.id,
        titleRu: pageTranslations.title,
      }).from(pages)
        .leftJoin(pageTranslations, sql`${pages.id} = ${pageTranslations.pageId} AND ${pageTranslations.locale} = 'ru'`)
        .where(eq(pages.status, 'DRAFT'))
        .orderBy(desc(pages.updatedAt))
        .limit(10)
        .all(),

      db.select({
        id: faqItems.id,
        titleRu: faqItemTranslations.question,
      }).from(faqItems)
        .leftJoin(faqItemTranslations, sql`${faqItems.id} = ${faqItemTranslations.faqItemId} AND ${faqItemTranslations.locale} = 'ru'`)
        .where(eq(faqItems.status, 'DRAFT'))
        .orderBy(faqItems.sortOrder)
        .limit(10)
        .all(),
    ])

    const drafts = [
      ...serviceDrafts.map(d => ({ id: d.id, titleRu: d.titleRu, type: 'service' })),
      ...postDrafts.map(d => ({ id: d.id, titleRu: d.titleRu, type: 'blog' })),
      ...pageDrafts.map(d => ({ id: d.id, titleRu: d.titleRu, type: 'page' })),
      ...faqDrafts.map(d => ({ id: d.id, titleRu: d.titleRu, type: 'faq' })),
    ]

    return {
      dbAvailable: true,
      stats: {
        services: { total: servicesCount?.count ?? 0, published: publishedServices?.count ?? 0 },
        blog: { total: postsCount?.count ?? 0, published: publishedPosts?.count ?? 0 },
        leads: { total: leadsCount?.count ?? 0, new: newLeads?.count ?? 0 },
        testimonials: { total: testimonialsCount?.count ?? 0, published: publishedTestimonials?.count ?? 0 },
        faq: { total: faqCount?.count ?? 0, published: publishedFaq?.count ?? 0 },
        media: { total: mediaCount?.count ?? 0 },
        users: { total: usersCount?.count ?? 0, active: activeUsers?.count ?? 0 },
        redirects: { total: redirectsCount?.count ?? 0 },
        revisions: { total: revisionsCount?.count ?? 0 },
      },
      recentLeads: recentLeads.map(l => ({ ...l, serviceName: null })),
      drafts,
    }
  } catch {
    return {
      dbAvailable: false,
      stats: { services: { total: 0, published: 0 }, blog: { total: 0, published: 0 }, leads: { total: 0, new: 0 }, testimonials: { total: 0, published: 0 }, faq: { total: 0, published: 0 }, media: { total: 0 }, users: { total: 0, active: 0 }, redirects: { total: 0 }, revisions: { total: 0 } },
      recentLeads: [],
      drafts: [],
    }
  }
}

/** @deprecated use getDashboardData */
export const getDashboardStats = getDashboardData
