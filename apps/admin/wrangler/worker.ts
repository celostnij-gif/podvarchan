// OpenNext admin worker — imported and resolved by wrangler bundler at deploy time
import openNextWorker, {
  DOQueueHandler,
  DOShardedTagCache,
  BucketCachePurge,
} from "../.open-next/worker.js";

export { DOQueueHandler, DOShardedTagCache, BucketCachePurge };

/**
 * Cron warm-up (P2.1, AGENTS.md §3): the public middleware reads the compiled
 * `redirect_rules` map from CONTENT_CACHE_KV on every request. The admin
 * rewrites it on every mutation of redirect_rules (syncRedirectRulesToKv), but
 * nothing re-mirrors it if the KV entry is evicted or a mutation bypassed the
 * normalized action path. This scheduled job recomputes the same map shape
 * from D1 every 10 minutes — idempotent overwrite, so a concurrent on-demand
 * sync is never clobbered with stale data.
 *
 * Runs in a scheduled invocation — its own CPU budget, no user request is
 * affected if it fails. Deliberately uses raw D1/KV bindings, not the shared
 * drizzle package: keeps the entry wrapper dependency-free for the wrangler
 * bundler (same zero-import-beyond-opennext approach as the public worker).
 */
async function resyncRedirectRules(env: CloudflareEnv): Promise<void> {
  const { results } = await env.DB.prepare(
    "SELECT from_path, to_path, status_code FROM redirect_rules WHERE is_enabled = 1"
  ).all<{ from_path: string; to_path: string; status_code: number }>();

  const map: Record<string, { to: string; code: number }> = {};
  for (const r of results) {
    map[r.from_path] = { to: r.to_path, code: r.status_code };
  }
  await env.CONTENT_CACHE_KV?.put("redirect_rules", JSON.stringify(map));
}

/**
 * Default export is a plain object literal with `fetch` and `scheduled`
 * methods. This matters: workerd's static handler detection only registers
 * `scheduled` as a cron handler when it is a method of the default export's
 * object literal, not a standalone named export (AGENTS.md §3.6 — verified
 * platform behaviour: a standalone export gets classified as a Durable Object
 * class and cron fails with "Handler does not export a scheduled() function").
 */
export default {
  fetch: (
    request: Request,
    env: CloudflareEnv,
    ctx: { waitUntil(promise: Promise<unknown>): void },
  ) => openNextWorker.fetch(request, env, ctx),
  scheduled: (
    _event: unknown,
    env: CloudflareEnv,
    ctx: { waitUntil(promise: Promise<unknown>): void },
  ): Promise<void> => {
    ctx.waitUntil(
      resyncRedirectRules(env)
        .then(() => console.log("[scheduled] redirect_rules resynced"))
        .catch((err: unknown) =>
          console.error("[scheduled] redirect_rules resync failed:", err)
        )
    );
    return Promise.resolve();
  },
};