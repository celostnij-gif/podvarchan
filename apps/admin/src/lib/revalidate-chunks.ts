/**
 * Batch-splitting for cross-worker cache invalidation.
 *
 * The public worker's /api/revalidate handler caps each array (paths/keys/
 * prefixes) at REVALIDATE_BATCH_LIMIT entries per request (CPU/latency guard).
 * This helper splits oversized collections into sequential batches so a bulk
 * mutation (e.g. bulkUpdateSeo across many entities × locales) NEVER silently
 * drops keys — the exact failure mode this invalidation layer exists to prevent.
 *
 * Pure and dependency-free (no next/shared imports) so it is unit-testable.
 */

export const REVALIDATE_BATCH_LIMIT = 40

export function chunkArray<T>(items: readonly T[], size: number): T[][] {
  if (!Number.isInteger(size) || size <= 0) {
    throw new Error('chunk size must be a positive integer')
  }
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size))
  }
  return out
}

export interface RevalidateBatch {
  paths: string[]
  keys: string[]
  prefixes: string[]
}

/**
 * Split paths/keys/prefixes into batches where every array stays under the
 * per-request limit. Batches align on the longest array: 90 keys with 3 paths
 * yields 3 batches, each carrying the 3 paths and its 40-key slice. Empty
 * batches are dropped.
 */
export function buildRevalidateBatches(
  input: RevalidateBatch,
  limit: number = REVALIDATE_BATCH_LIMIT,
): RevalidateBatch[] {
  const pathChunks = chunkArray(input.paths, limit)
  const keyChunks = chunkArray(input.keys, limit)
  const prefixChunks = chunkArray(input.prefixes, limit)
  const count = Math.max(pathChunks.length, keyChunks.length, prefixChunks.length)
  // Arrays that fit a single chunk are carried into EVERY batch — a multi-batch
  // key sweep repeats the small idempotent path invalidation instead of relying
  // on the first batch only. Oversized arrays are split by index.
  const carryPaths = pathChunks.length === 1 ? pathChunks[0] : null
  const carryPrefixes = prefixChunks.length === 1 ? prefixChunks[0] : null
  const batches: RevalidateBatch[] = []
  for (let i = 0; i < count; i++) {
    const batch = {
      paths: carryPaths ?? pathChunks[i] ?? [],
      keys: keyChunks[i] ?? [],
      prefixes: carryPrefixes ?? prefixChunks[i] ?? [],
    }
    if (batch.paths.length || batch.keys.length || batch.prefixes.length) {
      batches.push(batch)
    }
  }
  return batches
}
