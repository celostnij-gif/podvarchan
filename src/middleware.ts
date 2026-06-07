import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { NextRequest, NextResponse } from 'next/server'

const intlMiddleware = createMiddleware(routing)

export default function middleware(request: NextRequest): NextResponse {
  const accept = request.headers.get('accept') ?? ''
  const pathname = request.nextUrl.pathname

  // If the client requests Markdown format, rewrite to the /_markdown/ route
  if (accept.includes('text/markdown') && !pathname.startsWith('/_markdown/')) {
    const markdownUrl = new URL(request.nextUrl)
    markdownUrl.pathname = `/_markdown${pathname}`
    return NextResponse.rewrite(markdownUrl)
  }

  // Otherwise, proceed with the internationalisation middleware as usual
  return intlMiddleware(request)
}

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|_a2a|a2a|_markdown|markdown|.*\\..*).*)',
  ],
}
