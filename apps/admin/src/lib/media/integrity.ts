export const MEDIA_VARIANT_WIDTHS = [1600, 1200, 800, 400] as const
export const MAX_MEDIA_PART_BYTES = 10 * 1024 * 1024
export const MAX_MEDIA_UPLOAD_BYTES = 50 * 1024 * 1024
export const MAX_MEDIA_DIMENSION = 16384

interface DeleteBucket { delete(key: string): Promise<void> }

export function hasWebpSignature(value: ArrayBuffer | Uint8Array): boolean {
  const b = value instanceof Uint8Array ? value : new Uint8Array(value)
  return b.length >= 12 && b[0] === 82 && b[1] === 73 && b[2] === 70 && b[3] === 70 && b[8] === 87 && b[9] === 69 && b[10] === 66 && b[11] === 80
}

export function parseMediaDimension(value: FormDataEntryValue | null, name: string): number {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) throw new Error(name + ' must be a positive integer')
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed > MAX_MEDIA_DIMENSION) throw new Error(name + ' exceeds the allowed limit')
  return parsed
}

export function parseVariantWidths(raw: FormDataEntryValue | null): number[] {
  if (raw === null) return []
  if (typeof raw !== 'string') throw new Error('Invalid variants metadata')
  let value: unknown
  try { value = JSON.parse(raw) } catch { throw new Error('Invalid variants metadata') }
  if (!Array.isArray(value)) throw new Error('Invalid variants metadata')
  const allowed = new Set<number>(MEDIA_VARIANT_WIDTHS)
  const seen = new Set<number>()
  return value.map((item: unknown) => {
    if (typeof item !== 'object' || item === null || !('width' in item)) throw new Error('Invalid variant definition')
    const width = (item as { width: unknown }).width
    if (typeof width !== 'number' || !Number.isInteger(width) || !allowed.has(width)) throw new Error('Variant width is not allowed')
    if (seen.has(width)) throw new Error('Duplicate variant width')
    seen.add(width)
    return width
  })
}

export function getOwnedMediaKeys(id: string, storageKey: string, variantsJson: string | null): string[] {
  const masterPattern = new RegExp('^media/\\d{4}/\\d{2}/' + id.replace(/[.*+?^$()|[\]\\]/g, '\\$&') + '\\.webp$')
  if (!masterPattern.test(storageKey)) throw new Error('Media storage key does not belong to this asset')
  const keys = [storageKey]
  if (!variantsJson) return keys
  let variants: unknown
  try { variants = JSON.parse(variantsJson) } catch { throw new Error('Stored variants metadata is invalid') }
  if (!Array.isArray(variants)) throw new Error('Stored variants metadata is invalid')
  const prefix = storageKey.slice(0, -5)
  const seen = new Set<string>()
  for (const item of variants) {
    if (typeof item !== 'object' || item === null || !('width' in item) || !('url' in item)) throw new Error('Stored variant is invalid')
    const width = (item as { width: unknown }).width
    const url = (item as { url: unknown }).url
    if (typeof width !== 'number' || !Number.isInteger(width) || !MEDIA_VARIANT_WIDTHS.includes(width as 1600 | 1200 | 800 | 400)) throw new Error('Stored variant width is invalid')
    const key = prefix + '-' + width + '.webp'
    if (url !== '/api/media/' + key || seen.has(key)) throw new Error('Stored variant key does not belong to this asset')
    seen.add(key); keys.push(key)
  }
  return keys
}

export async function deleteR2Keys(bucket: DeleteBucket, keys: string[]): Promise<void> {
  for (const key of keys) await bucket.delete(key)
}

export async function rollbackR2Keys(bucket: DeleteBucket, keys: string[]): Promise<string[]> {
  const failures: string[] = []
  for (const key of [...keys].reverse()) { try { await bucket.delete(key) } catch { failures.push(key) } }
  return failures
}
