import { describe, it, expect } from 'vitest'
import {
  chunkArray,
  buildRevalidateBatches,
  REVALIDATE_BATCH_LIMIT,
} from '../../apps/admin/src/lib/revalidate-chunks'

const keys = (n: number) => Array.from({ length: n }, (_, i) => `key:${i}`)

describe('chunkArray', () => {
  it('splits oversized arrays into capped chunks', () => {
    expect(chunkArray(keys(90), 40).map((c) => c.length)).toEqual([40, 40, 10])
  })

  it('keeps small arrays in one chunk', () => {
    expect(chunkArray(['a', 'b'], 40)).toEqual([['a', 'b']])
  })

  it('returns no chunks for empty input', () => {
    expect(chunkArray([], 40)).toEqual([])
  })

  it('rejects non-positive sizes', () => {
    expect(() => chunkArray(keys(5), 0)).toThrow(/positive integer/)
  })
})

describe('buildRevalidateBatches', () => {
  it('covers EVERY key when the set exceeds the batch limit', () => {
    const all = keys(120)
    const batches = buildRevalidateBatches({ paths: ['/ru/'], keys: all, prefixes: [] })

    const covered = batches.flatMap((b) => b.keys)
    expect(covered).toEqual(all) // order preserved, nothing dropped
    expect(new Set(covered).size).toBe(all.length) // no duplicates
    expect(batches.length).toBe(Math.ceil(all.length / REVALIDATE_BATCH_LIMIT))
    expect(batches.every((b) => b.keys.length <= REVALIDATE_BATCH_LIMIT)).toBe(true)
  })

  it('carries paths and prefixes into every batch', () => {
    const all = keys(85)
    const batches = buildRevalidateBatches({ paths: ['/ru/blog/', '/sitemap.xml'], keys: all, prefixes: ['blog:images:'] })

    expect(batches.length).toBe(3)
    for (const b of batches) {
      expect(b.paths).toEqual(['/ru/blog/', '/sitemap.xml'])
      expect(b.prefixes).toEqual(['blog:images:'])
    }
  })

  it('aligns batches on the longest array', () => {
    const all = keys(90)
    const batches = buildRevalidateBatches({ paths: ['/ru/', '/uk/'], keys: all, prefixes: [] })
    // paths fit one chunk; keys need 3 → 3 batches, paths present in each
    expect(batches.length).toBe(3)
    expect(batches.every((b) => b.paths.length === 2)).toBe(true)
  })

  it('returns a single batch for small inputs', () => {
    const batches = buildRevalidateBatches({ paths: ['/ru/'], keys: keys(3), prefixes: ['media:'] })
    expect(batches).toEqual([{ paths: ['/ru/'], keys: keys(3), prefixes: ['media:'] }])
  })

  it('returns no batches for empty input', () => {
    expect(buildRevalidateBatches({ paths: [], keys: [], prefixes: [] })).toEqual([])
  })

  it('drops batches that would be entirely empty', () => {
    const batches = buildRevalidateBatches({ paths: ['/ru/'], keys: keys(45), prefixes: [] })
    // paths chunk length 1, keys chunk length 2 → 2 batches, none empty
    expect(batches.length).toBe(2)
    expect(batches[0].keys.length).toBe(40)
    expect(batches[1].keys.length).toBe(5)
    expect(batches[1].paths).toEqual(['/ru/'])
  })
})
