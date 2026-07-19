/**
 * GET /api/preview/sign?entityType=...&slug=...&locale=...&redirect=...
 *
 * Signs a preview token and redirects to the public /api/preview endpoint.
 * Runs on the admin worker (has PREVIEW_SECRET).
 */
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { canEditContent } from '@/lib/auth/permissions'
import { signPreviewToken } from '@/lib/preview'

const PUBLIC_SITE_URL =
  process.env.PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://podvarchan.com'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || !canEditContent(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const entityType = req.nextUrl.searchParams.get('entityType')
  const slug = req.nextUrl.searchParams.get('slug')
  const locale = req.nextUrl.searchParams.get('locale') || 'ru'

  const redirect = req.nextUrl.searchParams.get('redirect') || '/'

  if (!entityType || !slug) {
    return NextResponse.json(
      { error: 'Missing entityType or slug' },
      { status: 400 },
    )
  }

  try {
    const token = await signPreviewToken({ entityType, slug, locale })

    // Redirect to public /api/preview which sets the cookie and redirects to the page
    const previewUrl = new URL('/api/preview', PUBLIC_SITE_URL)
    previewUrl.searchParams.set('token', token)
    previewUrl.searchParams.set('redirect', redirect)

    return NextResponse.redirect(previewUrl.toString())
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to sign preview token' },
      { status: 500 },
    )
  }
}
