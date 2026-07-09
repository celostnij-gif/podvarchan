import { NextRequest, NextResponse } from 'next/server'


export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: pathSegments } = await params
  const storageKey = pathSegments.join('/')

  const { getCloudflareContext } = await import('@opennextjs/cloudflare')
  const { env } = getCloudflareContext()
  const r2 = env.MEDIA_R2_BUCKET as R2Bucket | undefined
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
