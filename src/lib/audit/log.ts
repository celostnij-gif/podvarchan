/**
 * Audit log — журнал дій адміністраторів.
 *
 * Кожна значуща дія в адмін-панелі записується в таблицю audit_logs.
 * Це дозволяє відстежити хто, що і коли зробив.
 */

import { drizzle } from 'drizzle-orm/d1'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import * as dbSchema from '@/db/schema'

/* ── Типи дій ── */

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'PUBLISH'
  | 'UNPUBLISH'
  | 'LOGIN'
  | 'LOGOUT'
  | 'UPLOAD'
  | 'SETTINGS_CHANGE'

export interface WriteAuditLogParams {
  userId: string
  action: AuditAction
  entityType: string
  entityId?: string | null
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
  request?: Request | null
}

/* ── Отримання IP та User-Agent з запиту ── */

function getIp(request: Request | null): string | undefined {
  if (!request) return undefined
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    undefined
  )
}

function getUserAgent(request: Request | null): string | undefined {
  if (!request) return undefined
  return request.headers.get('user-agent') ?? undefined
}

/* ── Функція запису в audit log ── */

/**
 * Записує дію в журнал аудиту.
 * Працює через D1 + Drizzle всередині Cloudflare Worker.
 *
 * @example
 * await writeAuditLog({
 *   userId: session.user.id,
 *   action: 'PUBLISH',
 *   entityType: 'SERVICE',
 *   entityId: serviceId,
 *   before: { status: 'DRAFT' },
 *   after: { status: 'PUBLISHED' },
 * })
 */
export async function writeAuditLog(params: WriteAuditLogParams): Promise<void> {
  try {
    const ctx = getCloudflareContext()
    const binding = (ctx.env as unknown as Record<string, unknown>).DB as D1Database | undefined
    if (!binding) return

    const db = drizzle(binding, { schema: dbSchema })

    await db.insert(dbSchema.auditLogs).values({
      id: crypto.randomUUID(),
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      beforeJson: params.before ? JSON.stringify(params.before) : null,
      afterJson: params.after ? JSON.stringify(params.after) : null,
      ip: getIp(params.request ?? null),
      userAgent: getUserAgent(params.request ?? null),
      createdAt: new Date(),
    })
  } catch (err) {
    // Audit log не повинен ламати основний функціонал
    console.error('[AuditLog] Помилка запису:', err)
  }
}
