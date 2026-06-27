/**
 * Wrangler entry point — re-exports OpenNext worker with agent DO classes.
 *
 * Wrangler bundles this file together with all its dependencies.
 * The OpenNext-generated worker (.open-next/worker.js) provides the
 * fetch handler and its own DOs (queue, cache, etc.). Agent classes
 * are added alongside.
 */
// OpenNext worker — imports resolved by wrangler bundler at deploy time
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge, default } from "../.open-next/worker.js";
