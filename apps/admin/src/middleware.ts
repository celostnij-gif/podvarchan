import { NextRequest, NextResponse } from 'next/server'

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Admin route protection
  if (pathname.startsWith('/admin')) {
    const p = pathname.replace(/\/+$/, '')

    // Login page is public
    if (p === '/admin/login') return NextResponse.next()
    // Static assets — let through
    if (p.includes('.')) return NextResponse.next()

    // Check for NextAuth session token
    const cookieName = request.url.startsWith('https')
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token'
    const token = request.cookies.get(cookieName)?.value
    if (!token) {
      if (p === '/admin/login') return NextResponse.next()
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return NextResponse.next()
  }

  // Skip API routes, static assets
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/_vercel/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Default redirect to /admin
  return NextResponse.redirect(new URL('/admin', request.url))
}

export const config = {
  matcher: [
    '/((?!_next/|\\.well-known/|favicon|.*\\.(?:svg|png|jpg|jpeg|webp|avif|ico|css|js|txt|xml|json|md)(?:/|$)).*)',
  ],
}
