/**
 * Preview API Route — предпросмотр черновиков.
 *
 * GET /api/admin/preview?entityType=SERVICE&entityId=xxx&locale=ru&redirect=/ru/uslugi/xxx
 *
 * 1. Перевіряє сесію адміністратора
 * 2. Встановлює __preview=1 cookie (1 година)
 * 3. Redirect на вказаний URL (або на /{locale}/)
 *
 * Публічний сайт перевіряє __preview cookie:
 * - якщо cookie є → завантажує DRAFT дані
 * - інакше → тільки PUBLISHED
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  try {
    // ── Перевірка авторизації ──
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Необхідна авторизація' },
        { status: 401 },
      )
    }

    // ── Параметри ──
    const { searchParams } = new URL(request.url)
    const redirectTo = searchParams.get('redirect') ?? '/'

    // ── Встановлюємо cookie для предпросмотра ──
    const response = NextResponse.redirect(new URL(redirectTo, request.url))

    response.cookies.set('__preview', '1', {
      httpOnly: false, // Доступно JS на публічному сайті
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 година
      path: '/',
    })

    // Також встановлюємо entityType/entityId/locale для точного завантаження
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')
    const locale = searchParams.get('locale')

    if (entityType) {
      response.cookies.set('__preview_entity_type', entityType, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60,
        path: '/',
      })
    }
    if (entityId) {
      response.cookies.set('__preview_entity_id', entityId, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60,
        path: '/',
      })
    }
    if (locale) {
      response.cookies.set('__preview_locale', locale, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60,
        path: '/',
      })
    }

    return response
  } catch {
    return NextResponse.json(
      { error: 'Внутрішня помилка сервера' },
      { status: 500 },
    )
  }
}
