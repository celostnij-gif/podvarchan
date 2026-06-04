/**
 * Типізований результат для Server Actions.
 *
 * Усі server actions повертають `ActionResult<T>` замість того,
 * щоб кидати винятки. Клієнт завжди може перевірити `result.success`.
 *
 * @example
 * ```ts
 * 'use server'
 *
 * export async function createService(data: ServiceInput): Promise<ActionResult<Service>> {
 *   return withRole('EDITOR', async (session) => {
 *     try {
 *       const service = await doCreate(data)
 *       return ok(service)
 *     } catch (e) {
 *       return fail('Не вдалося створити послугу')
 *     }
 *   })
 * }
 * ```
 */

/* ── Types ── */

export type ActionResult<T = void> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

/* ── Helpers ── */

/** Успішний результат з даними */
export function ok<T>(data: T, message?: string): ActionResult<T> {
  return { success: true, data, message }
}

/** Успішний результат без даних (для delete, publish тощо) */
export function okVoid(message?: string): ActionResult<void> {
  return { success: true, data: undefined, message }
}

/** Помилка */
export function fail(error: string, fieldErrors?: Record<string, string[]>): ActionResult<never> {
  return { success: false, error, fieldErrors }
}

/** Перевірка — чи успішний результат */
export function isOk<T>(result: ActionResult<T>): result is { success: true; data: T; message?: string } {
  return result.success
}

/** Перевірка — чи помилка */
export function isFail<T>(result: ActionResult<T>): result is { success: false; error: string } {
  return !result.success
}

/** Отримати дані з результату або кинути помилку */
export function unwrap<T>(result: ActionResult<T>): T {
  if (result.success) return result.data
  throw new Error(result.error)
}
