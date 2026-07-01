/**
 * Проверяет, доступен ли Turnstile на странице, и возвращает текущий токен.
 * Вызывается на клиенте перед отправкой формы.
 *
 * @returns токен cf-turnstile-response или null, если не готов/не загрузился
 */
export function getTurnstileToken(): string | null {
  if (typeof window === 'undefined') return null

  const turnstile = window.turnstile
  if (!turnstile?.getResponse) return null

  const token = turnstile.getResponse() as string | undefined
  return token ?? null
}

/**
 * Принудительно сбрасывает виджет Turnstile (для использования после успешной отправки).
 */
export function resetTurnstile(): void {
  if (typeof window === 'undefined') return

  const turnstile = window.turnstile
  if (!turnstile?.reset) return

  turnstile.reset()
}

/** Публичный ключ Turnstile (публичный, встраивается в HTML/JS — безопасно) */
export const TURNSTILE_SITE_KEY = '0x4AAAAAADYZ2z3RysEsBoQu' as const
