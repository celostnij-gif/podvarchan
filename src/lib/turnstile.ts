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

/**
 * Публичный ключ Turnstile (публичный, встраивается в HTML/JS — безопасно).
 * Значение приходит из env (NEXT_PUBLIC_TURNSTILE_SITE_KEY) — единый источник,
 * заданный в .env/.env.local/wrangler vars/CI (P1-5). Пустая строка = виджет не рендерится.
 */
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''
