import { z } from 'zod'

const envSchema = z.object({
  // Site
  NEXT_PUBLIC_SITE_URL: z.string().url().default('https://podvarchan.com'),
  NEXT_PUBLIC_GA_ID: z.string().min(1),

  // Contact
  CONTACT_EMAIL: z.string().email().optional(),
  RESEND_API_KEY: z.string().optional(),

  // Turnstile
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),

  // Revalidation
  REVALIDATE_SECRET: z.string().optional(),
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
