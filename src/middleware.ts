import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip API routes, static assets, well-known paths — they handle themselves
  // HTTP → HTTPS redirect (defense in depth — Cloudflare edge normally handles this)
  const proto = request.headers.get('x-forwarded-proto')
  if (proto === 'http') {
    const url = new URL(request.url)
    url.protocol = 'https:'
    return NextResponse.redirect(url.toString(), 301)
  }

  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/_vercel/') ||
    pathname.startsWith('/.well-known/') ||
    pathname === '/auth.md' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/images/') ||
    pathname.includes('.')
  ) {
    return intlMiddleware(request)
  }

  // Content negotiation: if agent requests Markdown, proxy through /api/md
  const accept = request.headers.get('Accept') ?? ''
  if (accept.includes('text/markdown')) {
    const url = new URL(request.url)
    const mdUrl = new URL('/api/md', url.origin)
    mdUrl.searchParams.set('url', url.toString())
    return NextResponse.rewrite(mdUrl)
  }

  const response = intlMiddleware(request)

  // Edge cache for public HTML pages — Worker hits are dramatically reduced
  // s-maxage=86400: CDN caches 24h, serves cached even if Worker is cold
  // stale-while-revalidate=3600: serves stale while revalidating in background
  if (response.status < 300) {
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=86400, stale-while-revalidate=3600'
    )
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next|_vercel|.*\\..*).*)',
  ],
}
