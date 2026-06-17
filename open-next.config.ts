import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const cfConfig = defineCloudflareConfig({});

export default {
  ...cfConfig,
  buildCommand: "npx next build",

  // Enable if you need R2 cache for ISR
  // import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
  // incrementalCache: r2IncrementalCache,
};
