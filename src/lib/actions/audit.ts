'use server'

/**
 * Server Actions для модуля «Журнал аудита».
 */

import { eq, desc, and } from 'drizzle-orm'
import { getActionDb } from './db'
import { ok, fail } from './result'
import { withCanViewAuditLog } from './guard'
import * as s from '@/db/schema'

export interface AuditLogFilter {
  action?: string
  entityType?: string
  userId?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}

export const getAuditLogs = withCanViewAuditLog(async (session, ...args) => {
  try {
    const db = getActionDb()
    const filter = (args[0] ?? {}) as AuditLogFilter
    const limit = filter.limit ?? 50
    const offset = filter.offset ?? 0

    const conditions = []

    if (filter.action) {
      conditions.push(eq(s.auditLogs.action, filter.action as never))
    }
    if (filter.entityType) {
      conditions.push(eq(s.auditLogs.entityType, filter.entityType))
    }
    if (filter.userId) {
      conditions.push(eq(s.auditLogs.userId, filter.userId))
    }

    const items = await db
      .select({
        log: s.auditLogs,
        user: {
          id: s.users.id,
          name: s.users.name,
          email: s.users.email,
        },
      })
      .from(s.auditLogs)
      .leftJoin(s.users, eq(s.auditLogs.userId, s.users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(s.auditLogs.createdAt))
      .limit(limit)
      .offset(offset)

    return ok(items)
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося завантажити журнал')
  }
})
