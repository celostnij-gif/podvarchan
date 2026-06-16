import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip API routes, static assets, well-known paths — they handle themselves
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

  return intlMiddleware(request)
}

export const config = {
  matcher: [
    '/((?!_next|_vercel|.*\\..*).*)',
  ],
}
