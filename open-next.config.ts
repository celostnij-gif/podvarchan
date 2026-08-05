import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import {
  STATIC_ASSET_CACHE_CONTROL,
  cdnTagForPath,
  isCacheableResponse,
  isHtmlNavigationRequest,
  isStaticAssetPath,
} from "./src/lib/cdn-cache";

/**
 * P0-2 fix (2026-08-05): CDN edge caching for worker-generated responses.
 *
 * On a Workers custom domain the worker sits in front of the zone cache, so
 * Cache Rules / edge TTL never apply to responses the worker creates itself
 * (SSR pages had no cf-cache-status at all). This wrapper wraps the default
 * `cloudflare-node` wrapper and:
 *
 *  1. serves cacheable GET navigations straight from `caches.default`, so a
 *     cache hit never touches the Next.js server (mitigates Error 1102 on
 *     traffic spikes);
 *  2. stores a Set-Cookie-free copy of cacheable responses (2xx with an
 *     explicit `s-maxage`, per the AGENTS.md §3 TTL matrix) under the request
 *     URL — the client still receives the original response (incl. Set-Cookie);
 *  3. tags every stored copy with `_N_T_<path>` (OpenNext's tag format) so
 *     /api/revalidate can purge globally via the purge API;
 *  4. normalizes Cache-Control for static assets — next.config.mjs headers()
 *     rules never reach file-server responses on Workers (the App Router
 *     default `max-age=0, must-revalidate` wins), so browsers would otherwise
 *     revalidate every asset on every load.
 *
 * RSC / router-prefetch requests are never cached and never served from cache
 * (their HTML twin is keyed by the same URL).
 */
const edgeCacheWrapper = () => ({
  wrapper: async (openNextHandler: unknown, converter: unknown) => {
    // Dynamic import is required here: the config is compiled twice (node for
    // the server bundle, edge for the middleware bundle) and cloudflare-node
    // pulls node:stream, which the edge build cannot bundle. The import stays
    // external in the edge compile (see edgeExternals below) and is never
    // resolved there — the middleware never invokes the default wrapper.
    const { default: cloudflareNodeWrapper } = await import(
      "@opennextjs/aws/overrides/wrappers/cloudflare-node.js"
    );
    const baseHandler = await cloudflareNodeWrapper.wrapper(
      openNextHandler,
      converter
    );

    return async (
      request: Request,
      env: unknown,
      ctx: { waitUntil: (promise: Promise<unknown>) => void },
      abortSignal?: AbortSignal
    ): Promise<Response> => {
      const url = new URL(request.url);
      const isNavigation = isHtmlNavigationRequest(request);

      if (isNavigation) {
        try {
          const cached = await caches.default.match(request);
          if (cached) return cached;
        } catch {
          // A cache failure must never break the site — fall through to render.
        }
      }

      const response = await baseHandler(request, env, ctx, abortSignal);

      // Static assets: next.config.mjs headers() rules never reach file-server
      // responses on Workers (the App Router default `max-age=0,
      // must-revalidate` wins), so normalize here — this wrapper's response is
      // the one the edge serves. Mirrors next.config.mjs /images, /_next/static,
      // /fonts sources.
      if (isStaticAssetPath(url.pathname)) {
        response.headers.set("cache-control", STATIC_ASSET_CACHE_CONTROL);
      }

      if (isNavigation && isCacheableResponse(response)) {
        try {
          const toCache = response.clone();
          const headers = new Headers(toCache.headers);
          headers.delete("set-cookie");
          headers.set("cache-tag", cdnTagForPath(url.pathname));
          const copy = new Response(toCache.body, {
            status: toCache.status,
            statusText: toCache.statusText,
            headers,
          });
          ctx.waitUntil(caches.default.put(request, copy).catch(() => {}));
        } catch {
          // Best-effort — the client still gets the fresh response.
        }
      }
      return response;
    };
  },
  name: "edge-cache-wrapper",
  supportStreaming: true,
  edgeRuntime: true,
});

const cfConfig = defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
});

const openNextConfig = {
  ...cfConfig,
  cloudflare: {
    // The stock validator requires `wrapper: "cloudflare-node"` verbatim; our
    // cache wrapper composes that exact wrapper, so the flag only relaxes the
    // string-equality check (documented "USE AT YOUR OWN RISK" option).
    ...cfConfig.cloudflare,
    dangerousDisableConfigValidation: true,
  },
  default: {
    ...cfConfig.default,
    override: {
      ...cfConfig.default.override,
      wrapper: edgeCacheWrapper,
    },
  },
  edgeExternals: [
    "node:crypto",
    "@opennextjs/aws/overrides/wrappers/cloudflare-node.js",
  ],
  buildCommand: "npx next build",
};

export default openNextConfig;
