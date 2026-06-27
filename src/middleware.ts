import {
  SERVICE_SLUG_UK,
  SERVICE_SLUG_FROM_UK,
  BLOG_SLUG_UK,
  BLOG_SLUG_FROM_UK,
  CATEGORY_SLUG_UK,
  CATEGORY_SLUG_FROM_UK,
} from '@/lib/slugMapping'

import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // P0-A: locale redirect — корень / редиректит на RU (дефолтный язык)
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/ru/', request.url), 302)
  }

  // Skip API routes, static assets, well-known paths — they handle themselves
  // HTTP → HTTPS redirect (defense in depth — Cloudflare edge normally handles this)
  const proto = request.headers.get('x-forwarded-proto')
  if (proto === 'http') {
    const url = new URL(request.url)
    url.protocol = 'https:'
    return NextResponse.redirect(url.toString(), 301)
  }

  // ── UK slug redirects ──
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length >= 3) {
    const [locale, section, ...rest] = segments

    if (locale === 'uk' && section === 'uslugi') {
      const slug = rest.join('/')
      const ukSlug = SERVICE_SLUG_UK[slug]
      if (ukSlug && ukSlug !== slug) {
        request.nextUrl.pathname = `/uk/uslugi/${ukSlug}/`
        return NextResponse.redirect(request.nextUrl, 301)
      }
    }

    if (locale === 'uk' && section === 'blog') {
      if (rest[0] === 'kategoriya' && rest[1]) {
        const cat = rest[1]
        const ukCat = CATEGORY_SLUG_UK[cat]
        if (ukCat && ukCat !== cat) {
          request.nextUrl.pathname = `/uk/blog/kategoriya/${ukCat}/`
          return NextResponse.redirect(request.nextUrl, 301)
        }
      } else if (rest.length === 1) {
        const slug = rest[0]
        const ukSlug = BLOG_SLUG_UK[slug]
        if (ukSlug && ukSlug !== slug) {
          request.nextUrl.pathname = `/uk/blog/${ukSlug}/`
          return NextResponse.redirect(request.nextUrl, 301)
        }
      }
    }

    if (locale === 'ru' && section === 'uslugi') {
      const slug = rest.join('/')
      const ruSlug = SERVICE_SLUG_FROM_UK[slug]
      if (ruSlug && ruSlug !== slug) {
        request.nextUrl.pathname = `/ru/uslugi/${ruSlug}/`
        return NextResponse.redirect(request.nextUrl, 301)
      }
    }


    if (locale === 'ru' && section === 'blog') {
      if (rest[0] === 'kategoriya' && rest[1]) {
        const cat = rest[1]
        const ruCat = CATEGORY_SLUG_FROM_UK[cat]
        if (ruCat && ruCat !== cat) {
          request.nextUrl.pathname = `/ru/blog/kategoriya/${ruCat}/`
          return NextResponse.redirect(request.nextUrl, 301)
        }
      } else if (rest.length === 1) {
        const slug = rest[0]
        const ruSlug = BLOG_SLUG_FROM_UK[slug]
        if (ruSlug && ruSlug !== slug) {
          request.nextUrl.pathname = `/ru/blog/${ruSlug}/`
          return NextResponse.redirect(request.nextUrl, 301)
        }
      }
    }
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
  // stale-if-error=604800: serve stale for 7d if Worker fails (mitigates free plan CPU limit)
  if (response.status < 300) {
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=86400, stale-while-revalidate=3600, stale-if-error=604800'
    )
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next|_vercel|.*\\..*).*)',
  ],
}
