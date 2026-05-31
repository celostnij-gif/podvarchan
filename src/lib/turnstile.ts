/**
 * Проверяет, доступен ли Turnstile на странице, и возвращает текущий токен.
 * Вызывается на клиенте перед отправкой формы.
 *
 * @returns токен cf-turnstile-response или null, если не готов/не загрузился
 */
export function getTurnstileToken(): string | null {
  if (typeof window === 'undefined') return null

  const turnstile = (window as any).turnstile
  if (!turnstile?.getResponse) return null

  const token = turnstile.getResponse() as string | undefined
  return token ?? null
}

/**
 * Принудительно сбрасывает виджет Turnstile (для использования после успешной отправки).
 */
export function resetTurnstile(): void {
  if (typeof window === 'undefined') return

  const turnstile = (window as any).turnstile
  if (!turnstile?.reset) return

  turnstile.reset()
}

/** Публичный ключ Turnstile из переменных окружения */
export const TURNSTILE_SITE_KEY = (
  typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY : undefined
) as string | undefined
