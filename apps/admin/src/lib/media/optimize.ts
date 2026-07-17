/**
 * Client-side image optimisation utilities.
 *
 * Generates WebP variants at standard widths using <canvas> in the browser.
 * No server CPU is consumed — only R2 put/get on the worker side.
 *
 * Usage (admin upload flow):
 *   1. User picks a file
 *   2. buildWebpVariants(file) → master blob + variant blobs
 *   3. FormData: master + variant blobs + widths
 *   4. POST /api/admin/media/upload
 *
 * See TEMP/IMPLEMENTATION_STEPS.md §E.1 and apps/admin/src/app/api/admin/media/upload/route.ts
 */

/* ── Config ── */

/** Target widths for responsive srcSet — no upscaling (naturalWidth checked in loop). */
export const VARIANT_WIDTHS = [1600, 1200, 800, 400] as const

/** WebP encode quality (0–1). 0.82 ≈ near-lossless for photos. */
export const VARIANT_QUALITY = 0.82

/* ── Types ── */

export interface MasterResult {
  blob: Blob
  width: number
  height: number
}

export interface VariantResult {
  width: number
  blob: Blob
}

export interface WebpVariantsResult {
  master: MasterResult
  variants: VariantResult[]
}

/* ── Helpers ── */

/**
 * Determine whether a file type is SVG — those are stored as-is without canvas conversion.
 */
export function isVectorImage(mimeType: string): boolean {
  return mimeType === 'image/svg+xml'
}

/**
 * Determine whether a mime type can be handled by our canvas pipeline.
 */
export function isRasterImage(mimeType: string): boolean {
  return (
    mimeType.startsWith('image/') &&
    !isVectorImage(mimeType) &&
    mimeType !== 'application/pdf'
  )
}

/* ── Main API ── */

/**
 * Generate WebP variants at standard widths (1600/1200/800/400) using <canvas>.
 *
 * - Only creates variants **smaller than or equal to** the source (no upscale).
 * - The largest generated variant becomes the master.
 * - Throws if no variant could be produced (should not happen for a valid raster image).
 *
 * @param file  A File object from an <input> or drop event.
 * @returns     Master blob + per-width variant blobs.
 */
export async function buildWebpVariants(file: File): Promise<WebpVariantsResult> {
  const img = await createImageBitmap(file)
  const naturalW = img.width
  const naturalH = img.height

  const variants: VariantResult[] = []
  let masterBlob: Blob | null = null
  let masterW = 0
  let masterH = 0

  for (const targetW of VARIANT_WIDTHS) {
    if (targetW > naturalW) continue // skip upscaling

    const ratio = targetW / naturalW
    const w = Math.round(naturalW * ratio)
    const h = Math.round(naturalH * ratio)

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0, w, h)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', VARIANT_QUALITY),
    )
    if (!blob) continue

    variants.push({ width: w, blob })

    // Largest generated variant = master
    if (!masterBlob || w > masterW) {
      masterBlob = blob
      masterW = w
      masterH = h
    }
  }

  img.close()

  if (!masterBlob || variants.length === 0) {
    throw new Error('Could not generate any WebP variant')
  }

  return { master: { blob: masterBlob, width: masterW, height: masterH }, variants }
}
