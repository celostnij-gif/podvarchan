import { NextRequest, NextResponse } from 'next/server'
import { buildMarkdownDocument } from '@/lib/md-converter'

/**
 * Markdown proxy for agent content negotiation.
 *
 * Receives requests rewritted from the middleware when
 * `Accept: text/markdown` is present on HTML page requests.
 * Fetches the actual page HTML, converts to Markdown, returns
 * with proper Content-Type and token-count headers.
 *
 * The request includes a query param `?url=` with the original
 * page URL so this handler can fetch the rendered HTML.
 */
export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const targetUrl = searchParams.get('url')

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing url param' }, { status: 400 })
  }

  try {
    // Fetch the page with explicit text/html accept header to avoid loops
    const htmlRes = await fetch(targetUrl, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        // Pass through the Host and other relevant headers
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
    const { markdown, tokenCount } = buildMarkdownDocument(html)

    return new NextResponse(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        Vary: 'Accept',
        'x-markdown-tokens': String(tokenCount),
      },
    })
  } catch (error) {
    console.error('Markdown proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to generate markdown' },
      { status: 500 },
    )
  }
}
