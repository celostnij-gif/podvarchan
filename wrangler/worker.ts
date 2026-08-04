// OpenNext worker — imported and resolved by wrangler bundler at deploy time
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge, default } from "../.open-next/worker.js";

/**
 * Cron warm-up (AGENTS.md §3 / incident 1102 fix): every 50 minutes, before
 * the `sitemap:xml` KV entry's 1 h TTL expires, ping the sitemap endpoint
 * through the self-reference service binding. The GET handler serves the KV
 * hit (cheap) or rebuilds+repopulates; either way the next user request finds
 * a warm cache instead of hitting the heavy cold render at peak traffic.
 *
 * The warm-up runs inside a scheduled invocation — its own CPU budget, no user
 * request is affected if it ever fails.
 */
export async function scheduled(
  _event: unknown,
  env: { WORKER_SELF_REFERENCE: Fetcher },
  ctx: { waitUntil(promise: Promise<unknown>): void },
): Promise<void> {
  ctx.waitUntil(
    env.WORKER_SELF_REFERENCE
      .fetch("https://podvarchan.com/sitemap.xml?cron=1")
      .then((res) => res.body?.cancel())
      .catch(() => {
        // warm-up is best-effort — the on-request path still serves KV/R2
      }),
  );
}
