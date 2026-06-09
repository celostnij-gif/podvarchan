/**
 * Environment variables validation using Zod.
 *
 * Всі змінні оточення проходять валідацію при старті.
 * Це запобігає помилкам через відсутні або некоректні значення.
 *
 * Для Next.js: імпортуй `env` тільки в Server Components / Server Actions / Route Handlers.
 * `NEXT_PUBLIC_*` змінні доступні і на клієнті через `process.env`.
 */

import { z } from 'zod'

/* ── Схема валідації ── */

const envSchema = z.object({
  /* ═══════════════════════
     САЙТ (обов'язкові)
     ═══════════════════════ */
  NEXT_PUBLIC_SITE_URL: z.string().url('NEXT_PUBLIC_SITE_URL must be a valid URL'),
  NEXT_PUBLIC_GA_ID: z.string().min(1, 'NEXT_PUBLIC_GA_ID is required'),
  GOOGLE_SITE_VERIFICATION: z.string().optional().default(''),

  /* ═══════════════════════
     TURNSTILE (CAPTCHA)
     ═══════════════════════ */
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1, 'NEXT_PUBLIC_TURNSTILE_SITE_KEY is required'),
  TURNSTILE_SECRET_KEY: z.string().min(1, 'TURNSTILE_SECRET_KEY is required'),

  /* ═══════════════════════
     RESEND (EMAIL)
     ═══════════════════════ */
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  CONTACT_EMAIL: z.string().email('CONTACT_EMAIL must be a valid email'),

  /* ═══════════════════════
     АДМІН-ПАНЕЛЬ — БАЗА ДАНИХ
     ═══════════════════════ */
  // DATABASE_URL — опціонально: потрібна тільки для drizzle-kit (локально),
  // не використовується на Cloudflare Workers runtime (там D1 binding)
  DATABASE_URL: z.string().optional(),
  CLOUDFLARE_ACCOUNT_ID: z.string().min(1, 'CLOUDFLARE_ACCOUNT_ID is required'),
  CLOUDFLARE_DATABASE_ID: z.string().min(1, 'CLOUDFLARE_DATABASE_ID is required'),

  /* ═══════════════════════
     АДМІН-ПАНЕЛЬ — AUTH
     ═══════════════════════ */
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),
  AUTH_GOOGLE_ID: z.string().min(1, 'AUTH_GOOGLE_ID is required').optional().default(''),
  AUTH_GOOGLE_SECRET: z.string().min(1, 'AUTH_GOOGLE_SECRET is required').optional().default(''),

  /* ═══════════════════════
     АДМІН-ПАНЕЛЬ — REVALIDATION
     ═══════════════════════ */
  REVALIDATE_SECRET: z.string().min(16, 'REVALIDATE_SECRET must be at least 16 characters').optional(),

  /* ═══════════════════════
     АДМІН-ПАНЕЛЬ — SEED
     ═══════════════════════ */
  ADMIN_SEED_EMAIL: z.string().email('ADMIN_SEED_EMAIL must be a valid email'),
  ADMIN_SEED_PASSWORD: z.string().min(8, 'ADMIN_SEED_PASSWORD must be at least 8 characters'),

  /* ═══════════════════════
     АДМІН-ПАНЕЛЬ — R2 (опціональні)
     ═══════════════════════ */
  S3_ENDPOINT: z.string().url('S3_ENDPOINT must be a valid URL').optional(),
  S3_REGION: z.string().optional().default('auto'),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  NEXT_PUBLIC_MEDIA_BASE_URL: z.string().url('NEXT_PUBLIC_MEDIA_BASE_URL must be a valid URL').optional(),
})

/* ── Типізований об'єкт env ── */

export type Env = z.infer<typeof envSchema>

/**
 * Валідований об'єкт змінних оточення.
 *
 * Використовуй `env.DATABASE_URL`, `env.AUTH_SECRET` тощо
 * замість `process.env.DATABASE_URL`.
 *
 * @throws {Error} Якщо якась змінна не проходить валідацію
 */
export const env: Env = envSchema.parse(process.env)

/* ── Перевірка для Next.js static analysis ── */

if (typeof window !== 'undefined') {
  console.warn('[env.ts] Imported on client side — only NEXT_PUBLIC_* vars are available')
}
