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
/**
 * Page warm (AGENTS.md §3.5 + incident 1102 cohort): every cron run rotates a
 * 40-URL slice of the sitemap through the self-reference binding. Sitemap.xml
 * is a cached aggregate (§3.5.1) — one KV get + a single regex pass. The slice
 * offset advances one bucket per cron tick (50 min), so the full ~200-URL list
 * is covered roughly every 4 hours. Cold renders thus happen on cron's own
 * budget instead of a live visitor's request, and the intermittent-1102 cohort
 * gets a persistent retry-by-time lottery instead of staying cold until a
 * deploy wave. Subrequest budget: 1 (sitemap) + 40 (pages) + 3 (aggregates
 * below) = 44 ≤ 50 per invocation. Bodies are drained so the edge/ISR caches
 * actually populate. Page URLs are fetched WITHOUT a cache-buster query on
 * purpose: the warm must populate the exact edge/ISR cache keys a visitor
 * request hits (the ?cron=1 bypass is only meaningful for the aggregate
 * handlers, whose artifact lives in KV, not in the URL-keyed caches).
 */
const PAGE_WARM_SLICE = 40;
const PAGE_WARM_BATCH = 8;
const CRON_TICK_MS = 50 * 60 * 1000;

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

  console.log("[scheduled] warm-up start: sitemap.xml + robots.txt + llms-full.txt + page slice");
  ctx.waitUntil(
    Promise.all([
      warm("/sitemap.xml", "sitemap"),
      warm("/robots.txt", "robots"),
      warm("/llms-full.txt", "llms-full"),
      (async () => {
        try {
          const sitemap = await env.WORKER_SELF_REFERENCE.fetch(
            "https://podvarchan.com/sitemap.xml?cron=1",
          );
          const xml = sitemap.ok ? await sitemap.text() : "";
          const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
          if (urls.length === 0) return;
          const bucket = Math.floor(Date.now() / CRON_TICK_MS);
          const offset = (bucket * PAGE_WARM_SLICE) % urls.length;
          const count = Math.min(PAGE_WARM_SLICE, urls.length);
          const slice: string[] = [];
          for (let i = 0; i < count; i++) slice.push(urls[(offset + i) % urls.length]);
          for (let i = 0; i < slice.length; i += PAGE_WARM_BATCH) {
            await Promise.all(
              slice.slice(i, i + PAGE_WARM_BATCH).map((u) =>
                env.WORKER_SELF_REFERENCE.fetch(u)
                  .then((res) => {
                    if (!res.ok) console.error(`[scheduled] page warm ${res.status}: ${u}`);
                    return res.arrayBuffer();
                  })
                  .catch((err: unknown) => {
                    console.error(`[scheduled] page warm failed: ${u}`, err);
                  }),
              ),
            );
          }
          console.log(
            `[scheduled] page warm done: ${slice.length}/${urls.length} (offset ${offset})`,
          );
        } catch (err) {
          console.error("[scheduled] page warm error:", err);
        }
      })(),
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
