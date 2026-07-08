'use server'

import { eq, sql } from 'drizzle-orm'
import { contactLeads } from '@podvarchan/shared'
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

export async function adminSearch(query: string): Promise<{ success: boolean; data: SearchResultItem[] }> {
  try {
    const user = await getCurrentUser()
    if (!user || !canEditContent(user.role)) return { success: false, data: [] }
    if (!query || query.trim().length < 2) return { success: true, data: [] }

    // TODO: implement proper full-text search across services, blog posts, pages, FAQ
    return { success: true, data: [] }
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
