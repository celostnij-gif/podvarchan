// OpenNext worker — imported and resolved by wrangler bundler at deploy time
import openNextWorker, {
  DOQueueHandler,
  DOShardedTagCache,
  BucketCachePurge,
} from "../.open-next/worker.js";

export { DOQueueHandler, DOShardedTagCache, BucketCachePurge };

/**
 * Cron warm-up (AGENTS.md §3 / incident 1102 fix): every 50 minutes, before
 * the cached artifacts' 1 h TTL expires, ping the KV-cached aggregate endpoints
 * through the self-reference service binding. Each GET handler serves the KV
 * hit (cheap) or rebuilds+repopulates; either way the next user request finds
 * a warm cache instead of hitting the heavy cold render at peak traffic.
 *
 * Currently warmed: /sitemap.xml (sitemap:xml), /robots.txt (robots:txt,
 * Phase 0.3 2026-08-25) and /llms-full.txt (llms:full:txt, Phase 5.1
 * 2026-09-01).
 *
 * The warm-up runs inside a scheduled invocation — its own CPU budget, no user
 * request is affected if it ever fails.
 */
async function scheduled(
  _event: unknown,
  env: { WORKER_SELF_REFERENCE: Fetcher },
  ctx: { waitUntil(promise: Promise<unknown>): void },
): Promise<void> {
  const warm = (path: string, label: string) =>
    env.WORKER_SELF_REFERENCE.fetch(`https://podvarchan.com${path}?cron=1`)
      .then(async (res) => {
        console.log(`[scheduled] ${label} warm-up done: ${res.status}`);
        res.body?.cancel();
      })
      .catch((err: unknown) => {
        // warm-up is best-effort — the on-request path still serves KV/R2
        console.error(`[scheduled] ${label} warm-up failed:`, err);
      });

  console.log("[scheduled] warm-up start: sitemap.xml + robots.txt + llms-full.txt");
  ctx.waitUntil(
    Promise.all([
      warm("/sitemap.xml", "sitemap"),
      warm("/robots.txt", "robots"),
      warm("/llms-full.txt", "llms-full"),
    ]),
  );
}

/**
 * Default export is a plain object literal with `fetch` and `scheduled`
 * methods. This matters: workerd's static handler detection only registers
 * `scheduled` as a cron handler when it is a method of the default export's
 * object literal. A standalone `export async function scheduled` gets bundled
 * by esbuild into an `export { ..., scheduled }` re-export block, which
 * workerd classifies as a Durable Object class — so cron invocations failed
 * with "Handler does not export a scheduled() function" (verified in the
 * deployed version metadata: `named_handlers: scheduled [class]`).
 */
export default {
  fetch: (
    request: Request,
    env: CloudflareEnv,
    ctx: { waitUntil(promise: Promise<unknown>): void },
  ) => openNextWorker.fetch(request, env, ctx),
  scheduled,
};
