/**
 * Глобальний middleware для:
 * 1. Захисту адмін-панелі (next-auth) — /admin/* маршрути
 * 2. Інтернаціоналізації (next-intl) — всі публічні маршрути
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

  // ── Захист адмін-маршрутів ──
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

  // ── Інтернаціоналізація (next-intl) для публічних маршрутів ──
  return intlMiddleware(request)
}

export const config = {
  matcher: [
    // Включаємо всі маршрути крім API, _next/static, _vercel, файлів
    '/((?!api|_next|_vercel|.*\\\\..*).*)',
  ],
}
