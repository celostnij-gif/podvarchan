'use server'

import { eq, sql, desc } from 'drizzle-orm'
import { services, blogPosts, contactLeads, testimonials, mediaAssets, faqItems } from '@podvarchan/shared'
import { getCurrentUser } from '@/lib/auth/session'
import { canEditContent } from '@/lib/auth/permissions'
import { getActionDb } from '@/lib/actions/db'

export interface DashboardData {
  dbAvailable: boolean
  stats: {
    services: { total: number; published: number }
    blog: { total: number; published: number }
    leads: { total: number; new: number }
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
      mediaCount,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(services).get(),
      db.select({ count: sql<number>`count(*)` }).from(services).where(eq(services.status, 'PUBLISHED')).get(),
      db.select({ count: sql<number>`count(*)` }).from(blogPosts).get(),
      db.select({ count: sql<number>`count(*)` }).from(blogPosts).where(eq(blogPosts.status, 'PUBLISHED')).get(),
      db.select({ count: sql<number>`count(*)` }).from(contactLeads).get(),
      db.select({ count: sql<number>`count(*)` }).from(contactLeads).where(eq(contactLeads.status, 'NEW')).get(),
      db.select({ count: sql<number>`count(*)` }).from(testimonials).get(),
      db.select({ count: sql<number>`count(*)` }).from(testimonials).where(eq(testimonials.status, 'PUBLISHED')).get(),
      db.select({ count: sql<number>`count(*)` }).from(mediaAssets).get(),
    ])

    const recentLeads = await db.select({
      id: contactLeads.id, name: contactLeads.name, email: contactLeads.email, phone: contactLeads.phone,
    }).from(contactLeads).orderBy(desc(contactLeads.createdAt)).limit(5)

    return {
      dbAvailable: true,
      stats: {
        services: { total: servicesCount?.count ?? 0, published: publishedServices?.count ?? 0 },
        blog: { total: postsCount?.count ?? 0, published: publishedPosts?.count ?? 0 },
        leads: { total: leadsCount?.count ?? 0, new: newLeads?.count ?? 0 },
        faq: { total: testimonialsCount?.count ?? 0, published: publishedTestimonials?.count ?? 0 }, // TODO: real FAQ count
        media: { total: mediaCount?.count ?? 0 },
        users: { total: 0, active: 0 }, // TODO: user stats
        redirects: { total: 0 },         // TODO: redirect stats
        revisions: { total: 0 },          // TODO: revision stats
      },
      recentLeads: recentLeads.map(l => ({ ...l, serviceName: null })),
      drafts: [], // TODO: draft queries
    }
  } catch {
    return {
      dbAvailable: false,
      stats: { services: { total: 0, published: 0 }, blog: { total: 0, published: 0 }, leads: { total: 0, new: 0 }, faq: { total: 0, published: 0 }, media: { total: 0 }, users: { total: 0, active: 0 }, redirects: { total: 0 }, revisions: { total: 0 } },
      recentLeads: [],
      drafts: [],
    }
  }
}

/** @deprecated use getDashboardData */
export const getDashboardStats = getDashboardData
