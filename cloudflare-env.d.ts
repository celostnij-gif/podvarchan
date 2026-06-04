/* ── Minimal KVNamespace type (avoiding @cloudflare/workers-types dep) ── */
interface KVNamespace {
  get(key: string, options?: { type: 'text' }): Promise<string | null>
  get<Expected extends unknown = unknown>(
    key: string,
    options: KVNamespaceGetOptions<Expected>
  ): Promise<Expected | null>
  put(
    key: string,
    value: string | ReadableStream | ArrayBuffer | FormData,
    options?: { expirationTtl?: number; expiration?: number; metadata?: unknown }
  ): Promise<void>
  delete(key: string): Promise<void>
  list(options?: {
    prefix?: string
    limit?: number
    cursor?: string
  }): Promise<{ keys: { name: string; expiration?: number; metadata?: unknown }[]; list_complete: boolean; cursor?: string }>
}

interface KVNamespaceGetOptions<Expected> {
  type: 'text' | 'json' | 'arrayBuffer' | 'stream'
  cacheTtl?: number
}

interface __BaseEnv_CloudflareEnv {
	ASSETS: Fetcher;
	NEXTJS_ENV: string;
	NEXT_PUBLIC_SITE_URL: string;
	NEXT_PUBLIC_GA_ID: string;
	NEXT_PUBLIC_TURNSTILE_SITE_KEY: string;
	CONTACT_EMAIL: string;
	WORKER_SELF_REFERENCE: Fetcher /* podvarchan */;
	RATE_LIMIT_KV?: KVNamespace;
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
