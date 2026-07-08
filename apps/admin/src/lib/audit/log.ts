'use server'

import { getActionDb } from '@/lib/actions/db'
import { auditLogs } from '@podvarchan/shared'

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'PUBLISH' | 'UNPUBLISH' | 'LOGIN' | 'LOGOUT' | 'UPLOAD' | 'REORDER' | 'SETTINGS_CHANGE'

export interface WriteAuditLogInput {
  userId: string
  action: AuditAction
  entityType: string
  entityId: string
  before?: unknown
  after?: unknown
  ip?: string
  userAgent?: string
}

export async function writeAuditLog(input: WriteAuditLogInput): Promise<void> {
  try {
    const db = await getActionDb()
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: input.userId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      beforeJson: input.before ? JSON.stringify(input.before) : null,
      afterJson: input.after ? JSON.stringify(input.after) : null,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
      createdAt: new Date().toISOString(),
    }).run()
  } catch {
    // fire-and-forget: never crash the caller
  }
}
