interface __BaseEnv_CloudflareEnv {
	ASSETS: Fetcher;
	NEXTJS_ENV: string;
	NEXT_PUBLIC_SITE_URL: string;
	NEXT_PUBLIC_GA_ID: string;
	NEXT_PUBLIC_TURNSTILE_SITE_KEY: string;
	CONTACT_EMAIL: string;
	WORKER_SELF_REFERENCE: Fetcher /* podvarchan */;
}

// Secrets set via `wrangler secret put` (not in wrangler.jsonc vars)
interface CloudflareSecrets {
	RESEND_API_KEY: string;
	TURNSTILE_SECRET_KEY: string;
}

declare namespace Cloudflare {
	interface Env extends __BaseEnv_CloudflareEnv, CloudflareSecrets {}
}

interface CloudflareEnv extends __BaseEnv_CloudflareEnv, CloudflareSecrets {}

declare namespace NodeJS {
	interface ProcessEnv
		extends Record<string, string | undefined>,
			__BaseEnv_CloudflareEnv,
			CloudflareSecrets {}
}
