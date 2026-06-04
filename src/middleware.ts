/**
 * Глобальний middleware для:
 * 1. Інтернаціоналізації (next-intl) — всі публічні маршрути
 * 2. Захисту адмін-панелі (next-auth) — /admin/* маршрути
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

const ADMIN_PUBLIC_ROUTES = ['/login', '/_error']

function isAdminPublicRoute(pathname: string): boolean {
  return ADMIN_PUBLIC_ROUTES.some((route) => pathname.endsWith(route))
}

/* ── Middleware ── */

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Захист адмін-маршрутів ──
  const adminRegex = /^\/(ru|uk)?\/admin(\/|$)/
  const isAdminRoute = adminRegex.test(pathname) || pathname.startsWith('/admin')

  if (isAdminRoute) {
    const isPublic = isAdminPublicRoute(pathname)

    if (!isPublic) {
      // Валідуємо JWT токен через next-auth/jwt
      const token = await getToken({ req: request })
      if (!token) {
        const locale = pathname.match(/^\/(ru|uk)\//)?.[1] ?? ''
        const loginUrl = locale ? `/${locale}/admin/login` : '/admin/login'
        return NextResponse.redirect(new URL(loginUrl, request.url))
      }
    } else {
      // Якщо користувач авторизований і йде на /admin/login
      const token = await getToken({ req: request })
      if (token) {
        const locale = pathname.match(/^\/(ru|uk)\//)?.[1] ?? ''
        const adminUrl = locale ? `/${locale}/admin` : '/admin'
        return NextResponse.redirect(new URL(adminUrl, request.url))
      }
    }
  }

  // ── Інтернаціоналізація (next-intl) ──
  return intlMiddleware(request)
}

export const config = {
  matcher: [
    // Включаємо всі маршрути крім API, _next/static, _vercel, файлів
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
}
