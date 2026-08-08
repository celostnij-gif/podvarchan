import { describe, expect, it } from 'vitest'
import { getOwnedMediaKeys, hasWebpSignature, parseMediaDimension, parseVariantWidths, rollbackR2Keys } from './integrity'

describe('media integrity helpers', () => {
  it('validates RIFF/WEBP magic bytes', () => {
    const valid = new Uint8Array([82,73,70,70,0,0,0,0,87,69,66,80])
    expect(hasWebpSignature(valid)).toBe(true)
    valid[8] = 0
    expect(hasWebpSignature(valid)).toBe(false)
  })

  it('accepts only owned master and variant keys', () => {
    const id = 'asset-1'
    const master = 'media/2026/04/asset-1.webp'
    expect(getOwnedMediaKeys(id, master, JSON.stringify([{ width: 800, url: '/api/media/media/2026/04/asset-1-800.webp' }]))).toEqual([master, 'media/2026/04/asset-1-800.webp'])
    expect(() => getOwnedMediaKeys(id, 'media/2026/04/../other.webp', null)).toThrow()
    expect(() => getOwnedMediaKeys(id, master, JSON.stringify([{ width: 800, url: '/api/media/media/other.webp' }]))).toThrow()
  })

  it('validates dimensions and allowlisted unique widths', () => {
    expect(parseMediaDimension('800', 'width')).toBe(800)
    expect(() => parseMediaDimension('1.5', 'width')).toThrow()
    expect(parseVariantWidths(JSON.stringify([{ width: 1600 }, { width: 400 }]))).toEqual([1600, 400])
    expect(() => parseVariantWidths(JSON.stringify([{ width: 400 }, { width: 400 }]))).toThrow()
    expect(() => parseVariantWidths(JSON.stringify([{ width: 401 }]))).toThrow()
  })

  it('rolls back all written keys in reverse and reports failures', async () => {
    const deleted: string[] = []
    const bucket = { delete: async (key: string) => { deleted.push(key); if (key === 'b') throw new Error('fail') } }
    await expect(rollbackR2Keys(bucket, ['a', 'b', 'c'])).resolves.toEqual(['b'])
    expect(deleted).toEqual(['c', 'b', 'a'])
  })
})
