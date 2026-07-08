'use server'

import { getDB } from '@/db'
import { auditLogs } from '@/db/schema/auth'
import { contentRevisions } from '@/db/schema/revisions'
import { getCurrentUser } from '@/lib/auth/session'
import { canViewAudit } from '@/lib/auth/permissions'
import { desc, eq, and } from 'drizzle-orm'

/* ════════════════════════════════════════
   Audit Log
   ════════════════════════════════════════ */

export async function getAuditLogs(params: {
  entityType?: string
  userId?: string
  action?: string
  limit?: number
  offset?: number
}) {
  const user = await getCurrentUser()
  if (!user || !canViewAudit(user.role)) throw new Error('Forbidden')

  const db = getDB()
  const conditions = []
  if (params.entityType) conditions.push(eq(auditLogs.entityType, params.entityType))
  if (params.userId) conditions.push(eq(auditLogs.userId, params.userId))
  if (params.action) conditions.push(eq(auditLogs.action, params.action))

  const where = conditions.length > 0 ? and(...conditions) : undefined

  return db
    .select()
    .from(auditLogs)
    .where(where)
    .orderBy(desc(auditLogs.createdAt))
    .limit(params.limit ?? 50)
    .offset(params.offset ?? 0)
    .all()
}

export async function getAuditEntityTypes() {
  const user = await getCurrentUser()
  if (!user || !canViewAudit(user.role)) throw new Error('Forbidden')

  const db = getDB()
  const rows = await db
    .select({ entityType: auditLogs.entityType })
    .from(auditLogs)
    .groupBy(auditLogs.entityType)
    .all()
  return rows.map((r) => r.entityType).filter((t): t is string => t !== null)
}

export async function getAuditActions() {
  const user = await getCurrentUser()
  if (!user || !canViewAudit(user.role)) throw new Error('Forbidden')

  const db = getDB()
  const rows = await db
    .select({ action: auditLogs.action })
    .from(auditLogs)
    .groupBy(auditLogs.action)
    .all()
  return rows.map((r) => r.action).filter((a): a is string => a !== null)
}

/* ════════════════════════════════════════
   Content Revisions
   ════════════════════════════════════════ */

export async function getRevisions(entityType: string, entityId: string) {
  const user = await getCurrentUser()
  if (!user || !canViewAudit(user.role)) throw new Error('Forbidden')

  const db = getDB()
  return db
    .select()
    .from(contentRevisions)
    .where(and(eq(contentRevisions.entityType, entityType), eq(contentRevisions.entityId, entityId)))
    .orderBy(desc(contentRevisions.createdAt))
    .all()
}
