import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

const cfConfig = defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
});

export default {
  ...cfConfig,
  buildCommand: "npx next build",
};
