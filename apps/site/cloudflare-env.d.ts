/* ── Minimal KVNamespace type (avoiding @cloudflare/workers-types dep) ── */
interface KVNamespace {
  get(key: string, options?: { type: 'text' }): Promise<string | null>
  get<Expected = unknown>(
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

/* ── Minimal R2Bucket type (avoids @cloudflare/workers-types dep) ── */
interface R2Bucket {
  put(key: string, value: ArrayBuffer | ReadableStream | string | Blob, options?: { httpMetadata?: { contentType?: string }; customMetadata?: Record<string, string> }): Promise<R2Object>
  get(key: string): Promise<R2Object | null>
  delete(key: string): Promise<void>
}
interface R2Object {
  key: string
  body: ReadableStream
  bodyUsed: boolean
  size: number
  httpMetadata?: { contentType?: string }
  customMetadata?: Record<string, string>
}

/* ── Minimal DurableObjectNamespace type (avoids @cloudflare/workers-types dep) ── */
interface DurableObjectNamespace<T extends object = object> {
  idFromName(name: string): DurableObjectId;
  idFromString(id: string): DurableObjectId;
  get(id: DurableObjectId): T;
  newUniqueId(options?: { jurisdiction?: string }): DurableObjectId;
}
interface DurableObjectId {
  name?: string;
  toString(): string;
  equals(other: DurableObjectId): boolean;
}
interface DurableObjectState {
  waitUntil(promise: Promise<unknown>): void;
  id: DurableObjectId;
  storage: { get<T = unknown>(key: string): Promise<T | undefined>; put<T>(key: string, value: T): Promise<void>; delete(key: string): Promise<boolean>; list<T = unknown>(options?: { limit?: number; prefix?: string }): Promise<Map<string, T>> };
}

interface KVNamespaceGetOptions<Expected> {
  type: 'text' | 'json' | 'arrayBuffer' | 'stream'
  cacheTtl?: number
}

/* ── Minimal D1Database type (avoids @cloudflare/workers-types dep) ── */
interface D1Database {
  prepare(query: string): D1PreparedStatement
  dump(): Promise<ArrayBuffer>
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<T[]>
  exec(query: string): Promise<void>
}
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = unknown>(colName?: string): Promise<T | null>
  run<T = unknown>(): Promise<{ results: T[]; success: boolean }>
  all<T = unknown>(): Promise<{ results: T[]; success: boolean }>
  raw<T = unknown>(): Promise<T[]>
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
	DB: D1Database;
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
