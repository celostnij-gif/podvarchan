import { NextRequest, NextResponse } from 'next/server'
import { buildMarkdownDocument } from '@/lib/md-converter'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const targetUrl = searchParams.get('url')

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing url param' }, { status: 400 })
  }

  try {
    const htmlRes = await fetch(targetUrl, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent':
          request.headers.get('User-Agent') ??
          'Podvarchan-Markdown-Agent/1.0',
      },
    })

    if (!htmlRes.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${htmlRes.status}` },
        { status: htmlRes.status },
      )
    }

    const html = await htmlRes.text()
    const originalTokenCount = Math.round(html.split(/\s+/).length * 1.3)
    const { markdown, tokenCount } = buildMarkdownDocument(html)

    const headers: Record<string, string> = {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
      Vary: 'Accept',
      'x-markdown-tokens': String(tokenCount),
      'x-original-tokens': String(originalTokenCount),
    }

    return new NextResponse(markdown, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('Markdown proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to generate markdown' },
      { status: 500 },
    )
  }
}
