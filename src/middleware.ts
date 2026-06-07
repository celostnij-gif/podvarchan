/**
 * Глобальний middleware для:
 * 1. Захисту адмін-панелі (next-auth) — /admin/* маршрути
 * 2. Markdown for Agents — перехоплення Accept: text/markdown
 * 3. Інтернаціоналізації (next-intl) — всі публічні маршрути
 *
 * Адмін-панель працює БЕЗ префікса локалі (на російській мові),
 * тому маршрути виглядають як /admin, /admin/login, /admin/users тощо.
 *
 * Автентифікація перевіряється через JWT токен (next-auth/jwt getToken).
 * Якщо користувач не авторизований — перенаправляє на /admin/login.
 * Якщо авторизований і йде на /admin/login — перенаправляє на /admin.
 */

import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

/* ── Список публічних маршрутів адмінки (без авторизації) ── */

const ADMIN_PUBLIC_ROUTES = ['/admin/login', '/admin/_error']

function isAdminPublicRoute(pathname: string): boolean {
  return ADMIN_PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
}

/* ── Middleware ── */

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── 1. Захист адмін-маршрутів ──
  // Адмінка працює без префікса локалі: /admin, /admin/login, /admin/users
  const isAdminRoute = pathname.startsWith('/admin')

  if (isAdminRoute) {
    const isPublic = isAdminPublicRoute(pathname)

    if (!isPublic) {
      // Валідуємо JWT токен через next-auth/jwt
      try {
        const token = await getToken({ req: request })
        if (!token) {
          return NextResponse.redirect(new URL('/admin/login', request.url))
        }
      } catch {
        // Якщо getToken не працює (dev mode без AUTH_SECRET) — redirect на логін
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
    } else {
      // Якщо користувач авторизований і йде на /admin/login — редирект на дашборд
      try {
        const token = await getToken({ req: request })
        if (token) {
          return NextResponse.redirect(new URL('/admin', request.url))
        }
      } catch {
        // getToken не працює — значить не авторизований, пропускаємо
      }
    }

    // Для адмін-маршрутів не запускаємо intlMiddleware
    return NextResponse.next()
  }

  // ── 1b. Agent-Ready маршрути (A2A, Markdown) — без локалізації ──
  if (pathname.startsWith('/_a2a') || pathname.startsWith('/a2a') ||
      pathname.startsWith('/_markdown') || pathname.startsWith('/markdown')) {
    return NextResponse.next()
  }

  // ── 2. Markdown for Agents (зовнішній запит) ──
  // Якщо клієнт запитує Markdown — rewrite на /_markdown/ роут
  const accept = request.headers.get('accept') ?? ''
  if (accept.includes('text/markdown') && !pathname.startsWith('/_markdown/')) {
    const markdownUrl = new URL(request.nextUrl)
    markdownUrl.pathname = `/_markdown${pathname}`
    return NextResponse.rewrite(markdownUrl)
  }

  // ── 3. Інтернаціоналізація (next-intl) для публічних маршрутів ──
  return intlMiddleware(request)
}

export const config = {
  matcher: [
    // Включаємо всі маршрути крім API, _next/static, _vercel, _a2a, a2a, _markdown, markdown, файлів з крапками
    '/((?!api|_next|_vercel|_a2a|a2a|_markdown|markdown|.*\\..*).*)',
  ],
}
