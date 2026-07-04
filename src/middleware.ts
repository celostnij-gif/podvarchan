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
  // P0: WWW → non-WWW redirect (301 permanent)
  const host = request.headers.get('host') ?? ''
  if (host.startsWith('www.')) {
    const url = new URL(request.url)
    url.host = host.replace(/^www\./, '')
    return NextResponse.redirect(url.toString(), 301)
  }


  // P0-A: locale redirect — корень / редиректит на RU (дефолтный язык)
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/ru/', request.url), 301)
  }

  // P0-B: /ua/ → /uk/ locale alias redirect (ISO country code to language code)
  // Handles any case: /UA/, /Ua/, /ua/… → /uk/…
  const uaLocaleMatch = pathname.match(/^\/ua(\/|$)/i)
  if (uaLocaleMatch) {
    const rest = pathname.slice(3) // strip '/ua' prefix, keep trailing slash/path
    return NextResponse.redirect(new URL(`/uk${rest}`, request.url), 301)
  }

  // Skip API routes, static assets, well-known paths — they handle themselves
  // HTTP → HTTPS redirect (defense in depth — Cloudflare edge normally handles this)
  const proto = request.headers.get('x-forwarded-proto')
  if (proto === 'http') {
    const url = new URL(request.url)
    url.protocol = 'https:'
    return NextResponse.redirect(url.toString(), 301)
  }

  // P1: Known-deleted pages → 410 Gone
  const gonePages = new Set(['/masters', '/masters/'])
  if (gonePages.has(pathname)) {
    return new Response(null, { status: 410 })
  }

  // P2: Old .html → new URL permanent redirects (301)
  const htmlPath = pathname.replace(/\/+$/, '') // strip trailing slashes for matching
  const oldHtmlRedirects: Record<string, string> = {
    '/otzyvy.html': '/ru/',
    '/diagnostika.html': '/ru/uslugi/',
    '/diagnostika_uk.html': '/uk/uslugi/',
    '/uslugi_uk.html': '/uk/uslugi/',
    '/index_uk.html': '/uk/',
  }
  if (oldHtmlRedirects[htmlPath]) {
    return NextResponse.redirect(new URL(oldHtmlRedirects[htmlPath], request.url), 301)
  }

  // Any path containing .html (not just ending in .html) is legacy.
  // Catches /diagnostika.html/blog/x/ and similar bot-invented paths.
  if (pathname.includes('.html')) {
    return new Response(null, { status: 410 })
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

  // Fix 307/302 → 308 for all locale detection redirects (SEO: permanent, method-preserving)
  if (response.status === 307 || response.status === 302) {
    const location = response.headers.get('Location')
    if (location) {
      const redirectResponse = NextResponse.redirect(new URL(location, request.url), 308)
      // Preserve locale cookie and other headers from intlMiddleware
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() !== 'location') {
          redirectResponse.headers.set(key, value)
        }
      })
      return redirectResponse
    }
  }

  // Edge cache for public HTML pages — Worker hits are dramatically reduced
  // s-maxage=604800: CDN caches 7 days
  // stale-while-revalidate=2592000: serves stale for 30d while revalidating in background
  // stale-if-error=604800: serve stale for 7d if Worker fails (mitigates free plan CPU limit)
  if (response.status < 300) {
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=604800, stale-while-revalidate=2592000, stale-if-error=604800'
    )
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/|api/|\\.well-known/|favicon|images/|.*\\.(?:svg|png|jpg|jpeg|webp|avif|ico|css|js|txt|xml|json|md)(?:/|$)).*)',
  ],
}

// ── Regression test cases (manual curl verification) ──
// 1. Bare path without locale prefix → 308:
//    curl -sI https://podvarchan.com/blog/pochemu-voznikaet-panika-nochyu/
//    → HTTP/2 308 → Location: /ru/blog/pochemu-voznikaet-panika-nochyu/
//
// 2. .html anywhere in path → 410 Gone:
//    curl -sI https://podvarchan.com/diagnostika.html/blog/anything/
//    → HTTP/2 410  (no redirect, no locale prefix added)
//    curl -sI https://podvarchan.com/unknown.html
//    → HTTP/2 410
//
// 3. 404 page → no canonical, noindex:
//    curl https://podvarchan.com/ru/nego-sushchestvuyushchiy/
//    → 200 (renders not-found)
//    → <meta name="robots" content="noindex, nofollow">
//    → NO <link rel="canonical">  (or canonical != /ru/)
//
// 4. Legacy .html with known mapping → 301 (unchanged):
//    curl -sI https://podvarchan.com/otzyvy.html
//    → HTTP/2 301 → Location: /ru/
//
// 5. /ua/ → /uk/ → 301 (unchanged):
//    curl -sI https://podvarchan.com/ua/uslugi/
//    → HTTP/2 301 → Location: /uk/uslugi/
