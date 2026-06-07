import { NextRequest, NextResponse } from 'next/server'
import { htmlToMarkdown } from '@/lib/html-to-markdown'

/* ── Route handler ── */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> },
): Promise<NextResponse> {
  try {
    const resolvedParams = await params
    const slug = resolvedParams.slug ?? []
    const origin = request.nextUrl.origin

    // Reconstruct the original page URL (add trailing slash to match trailingSlash: true config)
    const originalPath = slug.length > 0 ? `/${slug.join('/')}/` : '/'
    const pageUrl = `${origin}${originalPath}`

    // Fetch the original page as HTML (without Accept: text/markdown to avoid recursion)
    const pageResponse = await fetch(pageUrl, {
      headers: {
        Accept: 'text/html',
      },
    })

    if (!pageResponse.ok) {
      return NextResponse.json(
        { error: `Page not found: ${originalPath}` },
        { status: 404 },
      )
    }

    const html = await pageResponse.text()
    const markdown = htmlToMarkdown(html)
    const tokenCount = markdown.split(/\s+/).filter(Boolean).length

    return new NextResponse(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'x-markdown-tokens': String(tokenCount),
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('[Markdown Route] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error generating markdown' },
      { status: 500 },
    )
  }
}
