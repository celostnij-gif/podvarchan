/**
 * Login rate limiting модуль для Cloudflare Workers KV.
 *
 * Ліміт: 5 невдалих спроб за 15 хвилин на IP.
 * Використовує RATE_LIMIT_KV namespace (той самий, що й в public worker).
 *
 * У dev-режимі без KV — in-memory fallback.
 */
import { getCloudflareContext } from '@opennextjs/cloudflare'

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000

/* ── In-memory fallback ── */
const memoryStore = new Map<string, { attempts: number; resetTime: number }>()

/* ── Helper: отримати KV біндінг ── */
function getKvBinding(): KVNamespace | null {
  try {
    const binding = getCloudflareContext().env.RATE_LIMIT_KV as KVNamespace | undefined
    if (binding && typeof binding.get === 'function') return binding
  } catch {
    // fallback — працює в next dev без Cloudflare
  }
  return null
}

/* ── Інтерфейс запису в KV ── */
interface LoginRateLimitRecord {
  attempts: number
  resetTime: number
}

/* ── KV-based check ── */
async function checkKvLoginRateLimit(kv: KVNamespace, ip: string): Promise<boolean> {
  const key = `login:${ip}`
  const now = Date.now()

  try {
    const raw = await kv.get(key)
    const entry: LoginRateLimitRecord | null = raw ? JSON.parse(raw) : null

    if (!entry || entry.resetTime < now) {
      // Вікно скінчилося — скидаємо
      await kv.put(key, JSON.stringify({ attempts: 1, resetTime: now + WINDOW_MS }), {
        expirationTtl: Math.ceil(WINDOW_MS / 1000) + 60,
      })
      return true
    }

    if (entry.attempts >= MAX_ATTEMPTS) return false

    entry.attempts++
    await kv.put(key, JSON.stringify(entry), {
      expirationTtl: Math.ceil((entry.resetTime - now) / 1000) + 60,
    })
    return true
  } catch (err) {
    console.error('[LoginRateLimit] KV error, falling back to in-memory:', err)
    return checkMemoryLoginRateLimit(ip)
  }
}

/* ── In-memory check ── */
function checkMemoryLoginRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = memoryStore.get(ip)

  if (!entry || entry.resetTime < now) {
    memoryStore.set(ip, { attempts: 1, resetTime: now + WINDOW_MS })
    return true
  }

  if (entry.attempts >= MAX_ATTEMPTS) return false

  entry.attempts++
  return true
}

/* ── Публічний API ── */

/**
 * Перевіряє, чи не перевищив IP ліміт невдалих спроб входу.
 * @param ip — IP адреса клієнта
 * @returns true якщо можна пробувати, false якщо ліміт вичерпано
 */
export async function checkLoginRateLimit(ip: string): Promise<boolean> {
  const kv = getKvBinding()
  if (kv) {
    return checkKvLoginRateLimit(kv, ip)
  }
  return checkMemoryLoginRateLimit(ip)
}

/**
 * Скидає лічильник спроб для IP після успішного входу.
 */
export async function resetLoginRateLimit(ip: string): Promise<void> {
  const kv = getKvBinding()
  if (kv) {
    try {
      await kv.delete(`login:${ip}`)
    } catch { /* ignore */ }
  }
  memoryStore.delete(ip)
}

/**
 * Отримує IP клієнта з заголовків запиту.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1'
  )
}
