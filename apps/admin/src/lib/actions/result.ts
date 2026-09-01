'use server'

export type ActionResult<T = void> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

export function ok<T>(data: T, message?: string): ActionResult<T> {
  return { success: true, data, ...(message ? { message } : {}) }
}

export function fail(error: string, fieldErrors?: Record<string, string[]>): ActionResult<never> {
  return { success: false, error, ...(fieldErrors ? { fieldErrors } : {}) }
}
