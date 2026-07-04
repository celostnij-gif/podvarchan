import { z } from 'zod'

const envSchema = z.object({
  // Site
  NEXT_PUBLIC_SITE_URL: z.string().url().default('https://podvarchan.com'),
  NEXT_PUBLIC_GA_ID: z.string().min(1),

  // Auth
  AUTH_SECRET: z.string().min(32),
  AUTH_TRUST_HOST: z.string().optional(),

  // Admin seed
  ADMIN_SEED_EMAIL: z.string().email(),
  ADMIN_SEED_PASSWORD: z.string().min(8),

  // Cloudflare (for drizzle-kit / seed)
  CLOUDFLARE_ACCOUNT_ID: z.string().min(1),
  CLOUDFLARE_DATABASE_ID: z.string().min(1),
  CLOUDFLARE_API_TOKEN: z.string().min(1),

  // Contact
  CONTACT_EMAIL: z.string().email().optional(),
  RESEND_API_KEY: z.string().optional(),

  // Turnstile
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:')
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`)
  }
  process.exit(1)
}

export const env = parsed.data
