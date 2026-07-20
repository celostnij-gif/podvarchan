'use server'

import { eq, desc, and, gte, lte } from 'drizzle-orm'
import { auditLogs, contentRevisions } from '@podvarchan/shared'
import { getCurrentUser } from '@/lib/auth/session'
import { canManageSettings } from '@/lib/auth/permissions'
import { getActionDb } from './db'

async function requireAuditView(): Promise<void> {
  const user = await getCurrentUser()
  if (!user || !canManageSettings(user.role)) throw new Error('Заборонено')
}

export interface AuditLogFilters {
  entityType?: string
  action?: string
  userId?: string
  from?: string
  to?: string
  limit?: number
  offset?: number
}

export async function getAuditLogs(options?: AuditLogFilters) {
  await requireAuditView()
  const db = await getActionDb()
  const conditions = []
  if (options?.entityType) conditions.push(eq(auditLogs.entityType, options.entityType))
  if (options?.action) conditions.push(eq(auditLogs.action, options.action))
  if (options?.userId) conditions.push(eq(auditLogs.userId, options.userId))
  if (options?.from) conditions.push(gte(auditLogs.createdAt, options.from))
  if (options?.to) conditions.push(lte(auditLogs.createdAt, options.to))
  const query = db.select().from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(options?.limit ?? 50)
    .offset(options?.offset ?? 0)
  return conditions.length > 0
    ? await query.where(and(...conditions)).all()
    : await query.all()
}

export async function getAuditLogById(id: string) {
  await requireAuditView()
  const db = await getActionDb()
  return db.select().from(auditLogs).where(eq(auditLogs.id, id)).get()
}

export async function getAuditEntityTypes() {
  await requireAuditView()
  const db = await getActionDb()
  const rows = await db.select({ entityType: auditLogs.entityType }).from(auditLogs).groupBy(auditLogs.entityType).all()
  return rows.map(r => r.entityType).filter((t): t is string => t !== null)
}

export async function getAuditActions() {
  await requireAuditView()
  const db = await getActionDb()
  const rows = await db.select({ action: auditLogs.action }).from(auditLogs).groupBy(auditLogs.action).all()
  return rows.map(r => r.action).filter((a): a is string => a !== null)
}

export async function getRevisions(entityType: string, entityId: string) {
  await requireAuditView()
  const db = await getActionDb()
  return db.select()
    .from(contentRevisions)
    .where(and(eq(contentRevisions.entityType, entityType), eq(contentRevisions.entityId, entityId)))
    .orderBy(desc(contentRevisions.createdAt))
    .all()
}
