/**
 * Data fetching module for the admin dashboard.
 * Queries D1 via getCloudflareContext() with graceful fallback
 * when D1 is unavailable (dev mode, build time).
 */

import { sql, count, desc } from 'drizzle-orm'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getDb } from '@/db'
import * as s from '@/db/schema'

/* ── Types ── */

export interface DashboardStats {
  services:   { total: number; published: number; draft: number }
  blog:       { total: number; published: number; draft: number; scheduled: number; review: number }
  leads:      { total: number; new: number; inProgress: number; contacted: number; booked: number; spam: number }
  testimonials: { total: number; published: number; draft: number; hidden: number }
  faq:        { total: number; published: number; draft: number }
  pages:      { total: number; published: number; draft: number }
  media:      { total: number }
  users:      { total: number; active: number }
  redirects:  { total: number }
  revisions:  { total: number }
}

export interface RecentLead {
  id: string
  name: string
  email: string
  phone: string | null
  message: string | null
  sourcePage: string | null
  status: string
  createdAt: Date
}

export interface DraftItem {
  id: string
  title: string | null
  type: string
  status: string
  editUrl: string
  createdAt: Date | null
}

export interface SeoIssue {
  id: string
  title: string | null
  type: string
  issue: string
  editUrl: string
}

export interface DashboardData {
  stats: DashboardStats
  recentLeads: RecentLead[]
  drafts: DraftItem[]
  seoIssues: SeoIssue[]
  lastUpdated: Date
  dbAvailable: boolean
}

/* ── SQL helper: count by status ── */

function cntIf(statusCol: unknown, val: string) {
  return sql`cast(count(case when ${statusCol} = ${val} then 1 end) as int)`
}

/* ── Fetch ── */

export async function getDashboardData(): Promise<DashboardData> {
  try {
    const ctx = getCloudflareContext()
    const binding = (ctx.env as unknown as Record<string, unknown>).DB as D1Database | undefined
    if (!binding) {
      return getEmptyData()
    }
    const db = getDb(binding)

    // ── Stats ──

    const [
      servicesRow,
      blogRow,
      leadsRow,
      testimonialsRow,
      faqRow,
      pagesRow,
      mediaRow,
      usersRow,
      redirectsRow,
      revisionsRow,
      recentLeads,
      draftBlog,
      draftServices,
      draftPages,
      noDescSeo,
    ] = await Promise.all([
      // Services
      db.select({
        total: count(),
        published: cntIf(s.services.status, 'PUBLISHED'),
        draft: cntIf(s.services.status, 'DRAFT'),
      }).from(s.services),

      // Blog posts
      db.select({
        total: count(),
        published: cntIf(s.blogPosts.status, 'PUBLISHED'),
        draft: cntIf(s.blogPosts.status, 'DRAFT'),
        scheduled: cntIf(s.blogPosts.status, 'SCHEDULED'),
        review: cntIf(s.blogPosts.status, 'REVIEW'),
      }).from(s.blogPosts),

      // Leads
      db.select({
        total: count(),
        new: cntIf(s.contactLeads.status, 'NEW'),
        inProgress: cntIf(s.contactLeads.status, 'IN_PROGRESS'),
        contacted: cntIf(s.contactLeads.status, 'CONTACTED'),
        booked: cntIf(s.contactLeads.status, 'BOOKED'),
        spam: cntIf(s.contactLeads.status, 'SPAM'),
      }).from(s.contactLeads),

      // Testimonials
      db.select({
        total: count(),
        published: cntIf(s.testimonials.status, 'PUBLISHED'),
        draft: cntIf(s.testimonials.status, 'DRAFT'),
        hidden: cntIf(s.testimonials.status, 'HIDDEN'),
      }).from(s.testimonials),

      // FAQ
      db.select({
        total: count(),
        published: cntIf(s.faqItems.status, 'PUBLISHED'),
        draft: cntIf(s.faqItems.status, 'DRAFT'),
      }).from(s.faqItems),

      // Pages
      db.select({
        total: count(),
        published: cntIf(s.pages.status, 'PUBLISHED'),
        draft: cntIf(s.pages.status, 'DRAFT'),
      }).from(s.pages),

      // Media
      db.select({ total: count() }).from(s.mediaAssets),

      // Users
      db.select({
        total: count(),
        active: sql<number>`cast(count(case when ${s.users.isActive} = 1 then 1 end) as int)`,
      }).from(s.users),

      // Redirects
      db.select({ total: count() }).from(s.redirectRules),

      // Revisions
      db.select({ total: count() }).from(s.contentRevisions),

      // Recent leads (last 10)
      db.select({
        id: s.contactLeads.id,
        name: s.contactLeads.name,
        email: s.contactLeads.email,
        phone: s.contactLeads.phone,
        message: s.contactLeads.message,
        sourcePage: s.contactLeads.sourcePage,
        status: s.contactLeads.status,
        createdAt: s.contactLeads.createdAt,
      })
        .from(s.contactLeads)
        .orderBy(desc(s.contactLeads.createdAt))
        .limit(10),

      // Draft blog posts (limit 5)
      db.select({ id: s.blogPosts.id, status: s.blogPosts.status, createdAt: s.blogPosts.createdAt })
        .from(s.blogPosts)
        .where(sql`${s.blogPosts.status} = ${'DRAFT'}`)
        .limit(5),

      // Draft services (limit 5)
      db.select({ id: s.services.id, status: s.services.status, createdAt: s.services.createdAt })
        .from(s.services)
        .where(sql`${s.services.status} = ${'DRAFT'}`)
        .limit(5),

      // Draft pages (limit 5)
      db.select({ id: s.pages.id, status: s.pages.status, createdAt: s.pages.createdAt })
        .from(s.pages)
        .where(sql`${s.pages.status} = ${'DRAFT'}`)
        .limit(5),

      // SEO items missing description
      db.select({
        id: s.seoMeta.id,
        entityType: s.seoMeta.entityType,
        entityId: s.seoMeta.entityId,
        title: s.seoMeta.title,
        description: s.seoMeta.description,
        ogTitle: s.seoMeta.ogTitle,
        locale: s.seoMeta.locale,
      })
        .from(s.seoMeta)
        .where(sql`${s.seoMeta.description} IS NULL AND ${s.seoMeta.robotsIndex} = ${1}`)
        .limit(10),
    ])

    // ── Build result ──

    const sr = servicesRow[0]
    const br = blogRow[0]
    const lr = leadsRow[0]
    const tr = testimonialsRow[0]
    const fr = faqRow[0]
    const pr = pagesRow[0]
    const mr = mediaRow[0]
    const ur = usersRow[0]
    const rr = redirectsRow[0]
    const revr = revisionsRow[0]

    const draftItems: DraftItem[] = [
      ...draftBlog.map((p) => ({
        id: p.id,
        title: null,
        type: 'blog',
        status: p.status,
        editUrl: `/admin/blog/${p.id}`,
        createdAt: p.createdAt,
      })),
      ...draftServices.map((srv) => ({
        id: srv.id,
        title: null,
        type: 'service',
        status: srv.status,
        editUrl: `/admin/services/${srv.id}`,
        createdAt: srv.createdAt,
      })),
      ...draftPages.map((p) => ({
        id: p.id,
        title: null,
        type: 'page',
        status: p.status,
        editUrl: `/admin/pages/${p.id}`,
        createdAt: p.createdAt,
      })),
    ].sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0
      return b.createdAt.getTime() - a.createdAt.getTime()
    }).slice(0, 10)

    const seoIssueItems: SeoIssue[] = noDescSeo.map((s) => ({
      id: s.entityId ?? s.id,
      title: s.title,
      type: s.entityType,
      issue: s.description ? 'Нет OG title' : 'Нет meta-description',
      editUrl: `/admin/seo/${s.id}`,
    }))

    return {
      stats: {
        services:   { total: Number(sr.total), published: Number(sr.published), draft: Number(sr.draft) },
        blog:       { total: Number(br.total), published: Number(br.published), draft: Number(br.draft), scheduled: Number(br.scheduled), review: Number(br.review) },
        leads:      { total: Number(lr.total), new: Number(lr.new), inProgress: Number(lr.inProgress), contacted: Number(lr.contacted), booked: Number(lr.booked), spam: Number(lr.spam) },
        testimonials: { total: Number(tr.total), published: Number(tr.published), draft: Number(tr.draft), hidden: Number(tr.hidden) },
        faq:        { total: Number(fr.total), published: Number(fr.published), draft: Number(fr.draft) },
        pages:      { total: Number(pr.total), published: Number(pr.published), draft: Number(pr.draft) },
        media:      { total: Number(mr.total) },
        users:      { total: Number(ur.total), active: Number(ur.active) },
        redirects:  { total: Number(rr.total) },
        revisions:  { total: Number(revr.total) },
      },
      recentLeads: recentLeads.map((l) => ({
        id: l.id,
        name: l.name,
        email: l.email,
        phone: l.phone,
        message: l.message,
        sourcePage: l.sourcePage,
        status: l.status,
        createdAt: l.createdAt ?? new Date(),
      })),
      drafts: draftItems,
      seoIssues: seoIssueItems,
      lastUpdated: new Date(),
      dbAvailable: true,
    }
  } catch {
    return getEmptyData()
  }
}

/* ── Empty fallback ── */

function getEmptyData(): DashboardData {
  return {
    stats: {
      services:   { total: 0, published: 0, draft: 0 },
      blog:       { total: 0, published: 0, draft: 0, scheduled: 0, review: 0 },
      leads:      { total: 0, new: 0, inProgress: 0, contacted: 0, booked: 0, spam: 0 },
      testimonials: { total: 0, published: 0, draft: 0, hidden: 0 },
      faq:        { total: 0, published: 0, draft: 0 },
      pages:      { total: 0, published: 0, draft: 0 },
      media:      { total: 0 },
      users:      { total: 0, active: 0 },
      redirects:  { total: 0 },
      revisions:  { total: 0 },
    },
    recentLeads: [],
    drafts: [],
    seoIssues: [],
    lastUpdated: new Date(),
    dbAvailable: false,
  }
}
