import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/db'
import { mediaAssets } from '@/db/schema/media'
import { getCurrentUser } from '@/lib/auth/session'
import { canEditContent } from '@/lib/auth/permissions'

const ALLOWED_TYPES: Record<string, true> = {
  'image/jpeg': true,
  'image/png': true,
  'image/webp': true,
  'image/avif': true,
  'image/gif': true,
  'image/svg+xml': true,
  'application/pdf': true,
}

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || !canEditContent(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!(file.type in ALLOWED_TYPES)) {
    return NextResponse.json(
      { error: `File type ${file.type} is not allowed` },
      { status: 400 },
    )
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: 'File exceeds 10 MB size limit' },
      { status: 400 },
    )
  }

  const id = crypto.randomUUID()
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')

  // Cloudflare Workers runtime
  const { getCloudflareContext } = await import('@opennextjs/cloudflare')
  const { env } = getCloudflareContext()
  const r2 = env.MEDIA_R2_BUCKET as R2Bucket | undefined
  if (!r2) {
    return NextResponse.json({ error: 'Media storage not configured' }, { status: 500 })
  }

  // Upload master file
  const masterKey = `media/${yyyy}/${mm}/${id}.webp`
  const bytes = await file.arrayBuffer()

  await r2.put(masterKey, bytes, {
    httpMetadata: { contentType: 'image/webp' },
    customMetadata: { originalName: file.name },
  })

  // Process variant blobs
  const variantsMeta: { width: number; url: string }[] = []
  const variantsRaw = formData.get('variants')
  if (variantsRaw) {
    try {
      const variantDefs: { width: number }[] = JSON.parse(variantsRaw as string)
      for (const def of variantDefs) {
        const variantFile = formData.get(`variant-${def.width}`) as File | null
        if (!variantFile) continue
        const variantKey = `media/${yyyy}/${mm}/${id}-${def.width}.webp`
        const vBytes = await variantFile.arrayBuffer()
        await r2.put(variantKey, vBytes, {
          httpMetadata: { contentType: 'image/webp' },
          customMetadata: { originalName: file.name },
        })
        variantsMeta.push({
          width: def.width,
          url: `/api/media/${variantKey}`,
        })
      }
    } catch {
      // variants parsing error — non-fatal, store master-only
    }
  }

  const publicUrl = `/api/media/${masterKey}`
  const width = formData.get('width') ? Number(formData.get('width')) : null
  const height = formData.get('height') ? Number(formData.get('height')) : null
  const nowISO = now.toISOString()

  const db = getDB()
  await db.insert(mediaAssets).values({
    id,
    fileName: file.name,
    originalName: file.name,
    mimeType: 'image/webp',
    size: bytes.byteLength,
    width,
    height,
    storageKey: masterKey,
    publicUrl,
    variantsJson: variantsMeta.length > 0 ? JSON.stringify(variantsMeta) : null,
    uploadedById: user.id,
    createdAt: nowISO,
  })

  return NextResponse.json({
    id,
    url: publicUrl,
    fileName: file.name,
    mimeType: 'image/webp',
    size: bytes.byteLength,
    width,
    height,
    variants: variantsMeta,
  })
}
