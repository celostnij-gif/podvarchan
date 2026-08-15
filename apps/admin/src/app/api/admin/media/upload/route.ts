import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/db'
import { mediaAssets } from '@/db/schema/media'
import { getCurrentUser } from '@/lib/auth/session'
import { canEditContent } from '@/lib/auth/permissions'
import { hasWebpSignature, MAX_MEDIA_PART_BYTES, MAX_MEDIA_UPLOAD_BYTES, parseMediaDimension, parseVariantWidths, rollbackR2Keys } from '@/lib/media/integrity'

function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 })
}

async function readWebp(file: File, label: string): Promise<ArrayBuffer> {
  if (file.type !== 'image/webp') throw new Error(label + ' must be image/webp')
  if (file.size <= 0 || file.size > MAX_MEDIA_PART_BYTES) throw new Error(label + ' exceeds the per-part size limit')
  const bytes = await file.arrayBuffer()
  if (!hasWebpSignature(bytes)) throw new Error(label + ' has an invalid WebP signature')
  return bytes
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || !canEditContent(user.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let formData: FormData
  try { formData = await req.formData() } catch { return badRequest('Invalid multipart upload') }
  const fileEntry = formData.get('file')
  if (!(fileEntry instanceof File)) return badRequest('No file provided')

  let width: number
  let height: number
  let variantWidths: number[]
  const parts: { width: number; file: File; bytes: ArrayBuffer }[] = []
  let bytes: ArrayBuffer
  try {
    width = parseMediaDimension(formData.get('width'), 'width')
    height = parseMediaDimension(formData.get('height'), 'height')
    variantWidths = parseVariantWidths(formData.get('variants'))
    bytes = await readWebp(fileEntry, 'Master file')
    let totalSize = bytes.byteLength
    for (const variantWidth of variantWidths) {
      const entry = formData.get('variant-' + variantWidth)
      if (!(entry instanceof File)) throw new Error('Missing variant file for width ' + variantWidth)
      const variantBytes = await readWebp(entry, 'Variant ' + variantWidth)
      totalSize += variantBytes.byteLength
      if (totalSize > MAX_MEDIA_UPLOAD_BYTES) throw new Error('Upload exceeds the total size limit')
      parts.push({ width: variantWidth, file: entry, bytes: variantBytes })
    }
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : 'Invalid upload')
  }

  const id = crypto.randomUUID()
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const masterKey = `media/${yyyy}/${mm}/${id}.webp`
  const { getCloudflareContext } = await import('@opennextjs/cloudflare')
  const { env } = getCloudflareContext()
  const r2 = env.MEDIA_R2_BUCKET as R2Bucket | undefined
  if (!r2) return NextResponse.json({ error: 'Media storage not configured' }, { status: 500 })

  const writtenKeys: string[] = []
  const variantsMeta: { width: number; url: string }[] = []
  try {
    await r2.put(masterKey, bytes, { httpMetadata: { contentType: 'image/webp' }, customMetadata: { originalName: fileEntry.name } })
    writtenKeys.push(masterKey)
    for (const part of parts) {
      const variantKey = `media/${yyyy}/${mm}/${id}-${part.width}.webp`
      await r2.put(variantKey, part.bytes, { httpMetadata: { contentType: 'image/webp' }, customMetadata: { originalName: part.file.name } })
      writtenKeys.push(variantKey)
      variantsMeta.push({ width: part.width, url: '/api/media/' + variantKey })
    }

    const publicUrl = '/api/media/' + masterKey
    await getDB().insert(mediaAssets).values({
      id, fileName: fileEntry.name, originalName: fileEntry.name, mimeType: 'image/webp',
      size: bytes.byteLength, width, height, storageKey: masterKey, publicUrl,
      variantsJson: variantsMeta.length > 0 ? JSON.stringify(variantsMeta) : null,
      uploadedById: user.id, createdAt: now.toISOString(),
    })
    return NextResponse.json({ id, url: publicUrl, fileName: fileEntry.name, mimeType: 'image/webp', size: bytes.byteLength, width, height, variants: variantsMeta })
  } catch (error) {
    const rollbackFailures = await rollbackR2Keys(r2, writtenKeys)
    const detail = error instanceof Error ? error.message : 'unknown upload error'
    const rollbackDetail = rollbackFailures.length > 0 ? '; rollback failed for: ' + rollbackFailures.join(', ') : ''
    return NextResponse.json({ error: 'Media upload failed: ' + detail + rollbackDetail }, { status: 500 })
  }
}
