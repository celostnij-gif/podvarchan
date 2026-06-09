/* ── Minimal KVNamespace type (avoiding @cloudflare/workers-types dep) ── */
interface KVNamespace {
  get(key: string, options?: { type: 'text' }): Promise<string | null>
  get<Expected = unknown>(
    key: string,
    options: KVNamespaceGetOptions
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

interface KVNamespaceGetOptions {
  type: 'text' | 'json' | 'arrayBuffer' | 'stream'
  cacheTtl?: number
}

/* ── Cloudflare D1 Database type (без @cloudflare/workers-types) ── */

interface D1Database {
  prepare(query: string): D1PreparedStatement
  dump(): Promise<ArrayBuffer>
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<T[]>
  exec(query: string): Promise<{ count: number }>
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = unknown>(colName?: string): Promise<T | null>
  run<T = unknown>(): Promise<{ results: T[]; success: boolean; meta: Record<string, unknown> }>
  all<T = unknown>(): Promise<{ results: T[]; success: boolean; meta: Record<string, unknown> }>
  raw<T = unknown>(): Promise<T[]>
}

interface __BaseEnv_CloudflareEnv {
	ASSETS: Fetcher;
	NEXTJS_ENV: string;
	NEXT_PUBLIC_SITE_URL: string;
	NEXT_PUBLIC_GA_ID: string;
	NEXT_PUBLIC_TURNSTILE_SITE_KEY: string;
	CONTACT_EMAIL: string;
	AUTH_TRUST_HOST: string;
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
