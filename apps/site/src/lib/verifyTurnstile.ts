/**
 * Верифицирует Cloudflare Turnstile токен на сервере.
 *
 * POST-запрос на https://challenges.cloudflare.com/turnstile/v0/siteverify
 * с параметрами secret, response, remoteip (опционально).
 *
 * @param token - Токен из клиентской формы (cf-turnstile-response)
 * @param remoteIp - IP пользователя (опционально, но желательно)
 * @returns Объект с результатом проверки
 */
export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string,
): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY

  // Если ключ не задан — пропускаем проверку (dev-режим)
  if (!secretKey) {
    return { success: true }
  }

  if (!token) {
    return { success: false, error: 'Отсутствует Turnstile токен.' }
  }

  try {
    const body = new URLSearchParams({
      secret: secretKey,
      response: token,
    })

    if (remoteIp) {
      body.append('remoteip', remoteIp)
    }

    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      },
    )

    const data = (await response.json()) as {
      success: boolean
      'error-codes'?: string[]
    }

    if (!data.success) {
      const errorCodes = data['error-codes']?.join(', ') ?? 'unknown error'
      return {
        success: false,
        error: `Проверка капчи не пройдена: ${errorCodes}`,
      }
    }

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: `Ошибка верификации Turnstile: ${err instanceof Error ? err.message : 'неизвестная ошибка'}`,
    }
  }
}
