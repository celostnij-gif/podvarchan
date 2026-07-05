import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/db'
import { mediaAssets } from '@/db/schema/media'
import { getCurrentUser } from '@/lib/auth/session'
import { canEditContent } from '@/lib/auth/permissions'

export const runtime = 'edge'

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
  const ext = file.name.split('.').pop() || 'bin'
  const storageKey = `media/${id}.${ext}`
  const bytes = await file.arrayBuffer()

  // Upload to R2 via binding
  const r2 = process.env.MEDIA_R2_BUCKET as unknown as R2Bucket | undefined
  if (!r2) {
    return NextResponse.json({ error: 'Media storage not configured' }, { status: 500 })
  }

  await r2.put(storageKey, bytes, {
    httpMetadata: { contentType: file.type },
    customMetadata: { originalName: file.name },
  })

  // Build public URL — served via a Worker fetch handler or direct R2 public URL
  const publicUrl = `/api/media/${storageKey}`

  const now = new Date().toISOString()
  const db = getDB()
  await db.insert(mediaAssets).values({
    id,
    fileName: storageKey,
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
    storageKey,
    publicUrl,
    uploadedById: user.id,
    createdAt: now,
  })

  return NextResponse.json({
    id,
    url: publicUrl,
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
  })
}
