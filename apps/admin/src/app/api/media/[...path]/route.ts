import { NextRequest, NextResponse } from 'next/server'

/** Serve uploaded media files from R2 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: pathSegments } = await params
  const storageKey = pathSegments.join('/')

  // OpenNext injects Cloudflare bindings into process.env for API routes
  const r2 = process.env.MEDIA_R2_BUCKET as unknown as R2Bucket | undefined

  if (!r2) {
    return NextResponse.json({ error: 'Media storage not configured' }, { status: 500 })
  }

  const object = await r2.get(storageKey)
  if (!object) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const headers = new Headers()
  if (object.httpMetadata?.contentType) {
    headers.set('Content-Type', object.httpMetadata.contentType)
  }
  if (object.size) {
    headers.set('Content-Length', String(object.size))
  }
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')

  return new NextResponse(object.body, { headers })
}
