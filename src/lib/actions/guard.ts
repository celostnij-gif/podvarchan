/**
 * Guards для Server Actions — перевірка авторизації та ролей.
 *
 * Кожен guard приймає колбек з (session, ...args), і повертає функцію
 * яка отримує сесію всередині та передає args далі.
 *
 * @example
 * ```ts
 * 'use server'
 *
 * export const createService = withRole('EDITOR', async (session, data: unknown) => {
 *   // session — авторизований користувач
 *   // data — аргумент, переданий з клієнта
 *   return ok(result)
 * })
 * ```
 */

import { requireAdminSession, requireRole } from '@/lib/auth/session'
import { canDelete, canManageUsers, canManageSettings, canPublish, canUploadMedia, canViewAuditLog, canViewLeads } from '@/lib/auth/permissions'
import { fail, type ActionResult } from './result'
import type { SessionWithRole } from '@/types/auth'

/* ── Types ── */

/** Функція server action, видима клієнту — без session */
export type GuardedAction<T = void> = (...args: unknown[]) => Promise<ActionResult<T>>

/** Внутрішній колбек, який отримує session + аргументи клієнта */
type AsyncAction<T = void> = (session: SessionWithRole, ...args: unknown[]) => Promise<ActionResult<T>>

/* ── Helpers ── */

function toActionResult(err: unknown, defaultMsg: string): ActionResult<never> {
  return fail(err instanceof Error ? err.message : defaultMsg)
}

/* ── Guards ── */

/** Вимагає будь-якої автентифікації (VIEWER+) */
export function withAuth<T>(action: AsyncAction<T>): GuardedAction<T> {
  return async (...args: unknown[]) => {
    try {
      const session = await requireAdminSession()
      return action(session, ...args)
    } catch (err) {
      return toActionResult(err, 'Необхідна авторизація')
    }
  }
}

/** Вимагає мінімальної ролі */
export function withRole<T>(minRole: string, action: AsyncAction<T>): GuardedAction<T> {
  return async (...args: unknown[]) => {
    try {
      const session = await requireRole(minRole as never)
      return action(session, ...args)
    } catch (err) {
      return toActionResult(err, 'Недостатньо прав')
    }
  }
}

/** Вимагає права на публікацію (EDITOR+) */
export function withCanPublish<T>(action: AsyncAction<T>): GuardedAction<T> {
  return async (...args: unknown[]) => {
    try {
      const session = await requireAdminSession()
      if (!canPublish(session.user.role)) {
        return fail('Недостатньо прав для публікації. Потрібна роль EDITOR або вище.')
      }
      return action(session, ...args)
    } catch (err) {
      return toActionResult(err, 'Необхідна авторизація')
    }
  }
}

/** Вимагає права на видалення (ADMIN+) */
export function withCanDelete<T>(action: AsyncAction<T>): GuardedAction<T> {
  return async (...args: unknown[]) => {
    try {
      const session = await requireAdminSession()
      if (!canDelete(session.user.role)) {
        return fail('Недостатньо прав для видалення. Потрібна роль ADMIN або вище.')
      }
      return action(session, ...args)
    } catch (err) {
      return toActionResult(err, 'Необхідна авторизація')
    }
  }
}

/** Вимагає права на управління користувачами (OWNER) */
export function withCanManageUsers<T>(action: AsyncAction<T>): GuardedAction<T> {
  return async (...args: unknown[]) => {
    try {
      const session = await requireAdminSession()
      if (!canManageUsers(session.user.role)) {
        return fail('Тільки власник може управляти користувачами.')
      }
      return action(session, ...args)
    } catch (err) {
      return toActionResult(err, 'Необхідна авторизація')
    }
  }
}

/** Вимагає права на управління налаштуваннями (OWNER) */
export function withCanManageSettings<T>(action: AsyncAction<T>): GuardedAction<T> {
  return async (...args: unknown[]) => {
    try {
      const session = await requireAdminSession()
      if (!canManageSettings(session.user.role)) {
        return fail('Тільки власник може змінювати налаштування.')
      }
      return action(session, ...args)
    } catch (err) {
      return toActionResult(err, 'Необхідна авторизація')
    }
  }
}

/** Вимагає права на перегляд заявок (VIEWER+) */
export function withCanViewLeads<T>(action: AsyncAction<T>): GuardedAction<T> {
  return async (...args: unknown[]) => {
    try {
      const session = await requireAdminSession()
      if (!canViewLeads(session.user.role)) {
        return fail('Недостатньо прав для перегляду заявок.')
      }
      return action(session, ...args)
    } catch (err) {
      return toActionResult(err, 'Необхідна авторизація')
    }
  }
}

/** Вимагає права на завантаження медіа (EDITOR+) */
export function withCanUploadMedia<T>(action: AsyncAction<T>): GuardedAction<T> {
  return async (...args: unknown[]) => {
    try {
      const session = await requireAdminSession()
      if (!canUploadMedia(session.user.role)) {
        return fail('Недостатньо прав для завантаження медіа.')
      }
      return action(session, ...args)
    } catch (err) {
      return toActionResult(err, 'Необхідна авторизація')
    }
  }
}

/** Вимагає права на перегляд журналу (ADMIN+) */
export function withCanViewAuditLog<T>(action: AsyncAction<T>): GuardedAction<T> {
  return async (...args: unknown[]) => {
    try {
      const session = await requireAdminSession()
      if (!canViewAuditLog(session.user.role)) {
        return fail('Недостатньо прав для перегляду журналу.')
      }
      return action(session, ...args)
    } catch (err) {
      return toActionResult(err, 'Необхідна авторизація')
    }
  }
}
