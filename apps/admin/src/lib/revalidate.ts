import { revalidatePath } from 'next/cache'

/**
 * Revalidate a path, dispatching to the public site API for public routes.
 *
 * Admin-relative paths (starting with /admin) are revalidated in-app.
 * Public paths (like /uslugi, /blog, /) are POSTed to the public site's
 * revalidation endpoint, which runs on the site Worker.
 *
 * This is necessary because admin and site are now separate Workers.
 */
async function revalidatePublicPath(path: string, type?: 'page' | 'layout') {
  // Admin-internal paths: revalidate in-app
  if (path.startsWith('/admin')) {
    revalidatePath(path)
    return
  }

  // Public paths: POST to the site Worker
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://podvarchan.com'
  const secret = process.env.REVALIDATE_SECRET
  if (!secret) {
    console.warn(`[revalidate] REVALIDATE_SECRET not set — skipping revalidation of ${path}`)
    return
  }

  try {
    const res = await fetch(`${siteUrl}/api/revalidate/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, type: type || 'page', secret }),
    })
    if (!res.ok) {
      console.error(`[revalidate] POST failed (${res.status}) for ${path}`)
    }
  } catch (err) {
    console.error(`[revalidate] fetch error for ${path}:`, err)
  }
}

/**
 * Revalidate a page path.
 * For admin paths: revalidates in-app.
 * For public paths: POSTs to site Worker.
 */
export async function revalidateSitePath(path: string) {
  await revalidatePublicPath(path, 'page')
}

/**
 * Revalidate a layout path (clears all sub-pages).
 * For admin paths: revalidates in-app.
 * For public paths: POSTs to site Worker.
 */
export async function revalidateSiteLayout(path: string) {
  await revalidatePublicPath(path, 'layout')
}
