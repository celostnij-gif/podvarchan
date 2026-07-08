/**
 * Rate limiting модуль для Cloudflare Workers KV.
 *
 * Використовує KV namespace для зберігання лічильників запитів по IP.
 * Ліміт: 3 запити за 15 хвилин.
 *
 * У dev-режимі (або коли KV недоступний) використовує in-memory Map.
 *
 * ## Інструкція з налаштування KV
 *
 * ### 1. Створити KV namespace:
 *    npx wrangler kv namespace create RATE_LIMIT_KV
 *
 * ### 2. Додати ID в wrangler.jsonc:
 *    "kv": [{ "binding": "RATE_LIMIT_KV", "id": "ID_З_КРОКУ_1" }]
 *
 * ### 3. Для локальної розробки — wrangler створить його автоматично
 *    або закоментуйте та покладайтеся на in-memory fallback.
 */

import { getCloudflareContext } from '@opennextjs/cloudflare'

const MAX_REQUESTS = 3
const WINDOW_MS = 15 * 60 * 1000

/* ── In-memory fallback (використовується в dev без KV) ── */

const memoryStore = new Map<string, { count: number; resetTime: number }>()

/* ── Helper: отримати KV біндінг через OpenNext Cloudflare API ── */

function getKvBinding(): KVNamespace | null {
  try {
    const binding = getCloudflareContext().env.RATE_LIMIT_KV as KVNamespace | undefined
    if (binding && typeof binding.get === 'function') return binding
  } catch {
    // fallback — працює в next dev без Cloudflare, або без налаштованого KV
  }
  return null
}

/* ── Інтерфейс запису в KV ── */

interface RateLimitRecord {
  count: number
  resetTime: number
}

/* ── KV-based check ── */

async function checkKvRateLimit(kv: KVNamespace, ip: string): Promise<boolean> {
  const key = `ratelimit:${ip}`
  const now = Date.now()

  try {
    const raw = await kv.get(key)
    const entry: RateLimitRecord | null = raw ? JSON.parse(raw) : null

    if (!entry || entry.resetTime < now) {
      // Новий запис або вікно скінчилося
      await kv.put(key, JSON.stringify({ count: 1, resetTime: now + WINDOW_MS }), {
        expirationTtl: Math.ceil(WINDOW_MS / 1000) + 60, // TTL + 1 хв запасу
      })
      return true
    }

    if (entry.count >= MAX_REQUESTS) return false

    // Збільшуємо лічильник
    entry.count++
    await kv.put(key, JSON.stringify(entry), {
      expirationTtl: Math.ceil((entry.resetTime - now) / 1000) + 60,
    })
    return true
  } catch (err) {
    console.error('[RateLimit] KV error, falling back to in-memory:', err)
    return checkMemoryRateLimit(ip)
  }
}

/* ── In-memory check ── */

function checkMemoryRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = memoryStore.get(ip)

  if (!entry || entry.resetTime < now) {
    memoryStore.set(ip, { count: 1, resetTime: now + WINDOW_MS })
    return true
  }

  if (entry.count >= MAX_REQUESTS) return false

  entry.count++
  return true
}

/* ── Публічний API ── */

/**
 * Перевіряє, чи не перевищив IP ліміт запитів.
 * Спершу пробує KV, при недоступності падає на in-memory.
 */
export async function checkRateLimit(ip: string): Promise<boolean> {
  const kv = getKvBinding()
  if (kv) {
    return checkKvRateLimit(kv, ip)
  }
  return checkMemoryRateLimit(ip)
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
