/**
 * Data fetching module for the admin dashboard.
 * СТАБ: до міграції Server Actions повертає порожні дані.
 */

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
  phone: string | null
  email: string | null
  serviceName: string | null
  status: string
  createdAt: Date | null
}

export interface DraftItem {
  id: string
  type: string
  titleRu: string | null
  updatedAt: Date | null
}

export interface SeoIssue {
  type: string
  entityType: string
  entityId: string
  label: string
  field: string
}

export interface DashboardData {
  stats: DashboardStats
  recentLeads: RecentLead[]
  drafts: DraftItem[]
  seoIssues: SeoIssue[]
  dbAvailable: boolean
}

export async function getDashboardData(): Promise<DashboardData> {
  return {
    stats: {
      services: { total: 0, published: 0, draft: 0 },
      blog: { total: 0, published: 0, draft: 0, scheduled: 0, review: 0 },
      leads: { total: 0, new: 0, inProgress: 0, contacted: 0, booked: 0, spam: 0 },
      testimonials: { total: 0, published: 0, draft: 0, hidden: 0 },
      faq: { total: 0, published: 0, draft: 0 },
      pages: { total: 0, published: 0, draft: 0 },
      media: { total: 0 },
      users: { total: 0, active: 0 },
      redirects: { total: 0 },
      revisions: { total: 0 },
    },
    recentLeads: [],
    drafts: [],
    seoIssues: [],
    dbAvailable: false,
  }
}
