/**
 * Revision creation — зберігає знімок сутності в contentRevisions.
 *
 * Викликається:
 * - при кожній публікації (label: "Публикация YYYY-MM-DD HH:mm")
 * - при ручному "Сохранить версию" (label: введений користувачем)
 * - автоматично кожні 10 хвилин якщо є зміни (з клієнта через окремий action)
 */

import { and, eq, desc } from 'drizzle-orm'
import { getActionDb } from '@/lib/actions/db'
import { writeAuditLog } from '@/lib/audit/log'
import * as s from '@/db/schema'

export interface CreateRevisionParams {
  entityType: string
  entityId: string
  locale?: string
  data: Record<string, unknown>
  userId: string
  label?: string
}

/**
 * Створює нову ревізію (знімок) сутності.
 * Повертає id створеної ревізії.
 */
export async function createRevision(params: CreateRevisionParams): Promise<string> {
  const db = getActionDb()
  const id = crypto.randomUUID()

  await db.insert(s.contentRevisions).values({
    id,
    entityType: params.entityType,
    entityId: params.entityId,
    locale: (params.locale ?? null) as 'ru' | 'uk' | null,
    dataJson: JSON.stringify(params.data),
    createdById: params.userId,
    label: params.label ?? null,
    createdAt: new Date(),
  })

  await writeAuditLog({
    userId: params.userId,
    action: 'CREATE',
    entityType: 'REVISION',
    entityId: id,
    after: { entityType: params.entityType, entityId: params.entityId, label: params.label },
  })

  return id
}

/**
 * Повертає список ревізій для сутності (від найновіших до найстаріших).
 */
export async function getRevisions(
  entityType: string,
  entityId: string,
  limit = 20,
): Promise<Array<{
  id: string
  entityType: string
  entityId: string
  locale: string | null
  label: string | null
  createdById: string | null
  createdAt: Date
}>> {
  const db = getActionDb()
  const rows = await db
    .select({
      id: s.contentRevisions.id,
      entityType: s.contentRevisions.entityType,
      entityId: s.contentRevisions.entityId,
      locale: s.contentRevisions.locale,
      label: s.contentRevisions.label,
      createdById: s.contentRevisions.createdById,
      createdAt: s.contentRevisions.createdAt,
    })
    .from(s.contentRevisions)
    .where(
      and(
        eq(s.contentRevisions.entityType, entityType),
        eq(s.contentRevisions.entityId, entityId),
      ),
    )
    .orderBy(desc(s.contentRevisions.createdAt))
    .limit(limit)

  return rows as Array<{
    id: string
    entityType: string
    entityId: string
    locale: string | null
    label: string | null
    createdById: string | null
    createdAt: Date
  }>
}

/**
 * Отримує дані конкретної ревізії.
 */
export async function getRevisionData(id: string): Promise<Record<string, unknown> | null> {
  const db = getActionDb()
  const [revision] = await db
    .select({ dataJson: s.contentRevisions.dataJson })
    .from(s.contentRevisions)
    .where(eq(s.contentRevisions.id, id))
    .limit(1)

  if (!revision) return null

  try {
    return JSON.parse(revision.dataJson) as Record<string, unknown>
  } catch {
    return null
  }
}
