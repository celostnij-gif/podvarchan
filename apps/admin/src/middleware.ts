import NextAuth from 'next-auth'
import authConfig from '@/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((request) => {
  const { pathname } = request.nextUrl

  // Admin route protection
  if (pathname.startsWith('/admin')) {
    const p = pathname.replace(/\/+$/, '')

    // Login page is public
    if (p === '/admin/login') return NextResponse.next()
    // Static assets — let through
    if (p.includes('.')) return NextResponse.next()

    // NextAuth verifies the auth.js session JWT (signature + exp) on the edge.
    if (!request.auth?.user) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
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
})

export const config = {
  matcher: [
    '/((?!_next/|\\.well-known/|favicon|.*\\.(?:svg|png|jpg|jpeg|webp|avif|ico|css|js|txt|xml|json|md)(?:/|$)).*)',
  ],
}
