import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/env'
import { buildMarkdownDocument } from '@/lib/md-converter'
import { validateMdTarget } from '@/lib/md-url'
import { withCache } from '@/lib/db/kv-cache'

const FETCH_TIMEOUT_MS = 5000
const MAX_HTML_BYTES = 1_500_000
const CACHE_TTL_SECONDS = 3600

async function readLimitedBody(response: Response): Promise<string> {
  const declared = Number(response.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > MAX_HTML_BYTES) throw new Error('response-too-large')
  if (!response.body) return ''
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > MAX_HTML_BYTES) {
      await reader.cancel()
      throw new Error('response-too-large')
    }
    chunks.push(value)
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
  return new TextDecoder().decode(bytes)
}

async function generateMarkdown(url: URL, userAgent: string | null): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      redirect: 'manual',
      signal: controller.signal,
      headers: { Accept: 'text/html,application/xhtml+xml', 'User-Agent': userAgent ?? 'podvarchan-md/1.0' },
    })
    if (response.status >= 300 && response.status < 400) throw new Error('redirect-rejected')
    if (!response.ok || response.url && new URL(response.url).origin !== url.origin) throw new Error('upstream-failed')
    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.toLowerCase().includes('text/html')) throw new Error('invalid-content-type')
    return buildMarkdownDocument(await readLimitedBody(response)).markdown
  } finally { clearTimeout(timeout) }
}

export async function GET(request: NextRequest) {
  const raw = new URL(request.url).searchParams.get('url')
  if (!raw) return NextResponse.json({ error: 'Missing url param' }, { status: 400 })
  const target = validateMdTarget(raw, env.NEXT_PUBLIC_SITE_URL)
  if (!target.ok) return NextResponse.json({ error: 'Invalid public URL' }, { status: 400 })
  try {
    const markdown = await withCache('md:' + target.url.pathname, CACHE_TTL_SECONDS, () => generateMarkdown(target.url, request.headers.get('user-agent')))
    return new NextResponse(markdown, { headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400' } })
  } catch {
    return NextResponse.json({ error: 'Unable to convert page' }, { status: 502 })
  }
}