/**
 * GET /api/preview?token=...&redirect=...
 *
 * Verifies a signed preview token, sets __preview cookie, redirects to the page.
 * Used by the admin "Переглянути" button.
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyPreviewToken } from '@/lib/preview'


export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const redirect = req.nextUrl.searchParams.get('redirect') || '/'

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  const payload = verifyPreviewToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }

  const res = NextResponse.redirect(new URL(redirect, req.url))
  res.cookies.set('__preview', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 3600, // 1 hour
  })
  return res
}
