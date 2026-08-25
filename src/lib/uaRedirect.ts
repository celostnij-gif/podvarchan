/**
 * Single-hop /ua/* → /uk/* redirect resolution (Phase 0.4, 2026-08-25).
 *
 * /ua/ is a legacy locale alias (ISO country code → language code). Before
 * Phase 0.4 the middleware emitted /ua/uslugi/ → /uk/uslugi/ and let the UK
 * cutover block add a second hop → /uk/poslugy/. This resolver folds locale
 * aliasing AND slug localization into one 301:
 *   - services section: uslugi|poslugy → /uk/poslugy/<SERVICE_SLUG_UK[slug]>
 *   - blog posts/categories mapped through BLOG_SLUG_UK / CATEGORY_SLUG_UK
 *   - static page renames: tseny → tsiny, ob-avtore → pro-avtora
 *   - anything else: /ua/<rest> → /uk/<rest>
 *
 * Pure function (no next/server imports) so it is unit-testable — see
 * tests/unit/ua-redirect.test.ts.
 */
import {
  SERVICE_SLUG_UK,
  BLOG_SLUG_UK,
  CATEGORY_SLUG_UK,
} from '@/lib/slugMapping'

function withTrailingSlash(path: string): string {
  return path.endsWith('/') ? path : `${path}/`
}

export function resolveUaRedirect(pathname: string): string | null {
  const m = pathname.match(/^\/ua(\/|$)/i)
  if (!m) return null

  const rest = pathname.slice(m[0].length) // '' | 'uslugi/x/' | 'blog/kategoriya/trevoga/' …
  const segs = rest.split('/').filter(Boolean)
  if (segs.length === 0) return '/uk/'

  const [section, ...tail] = segs
  let target: string

  if (section === 'uslugi' || section === 'poslugy') {
    const slug = tail.join('/')
    const ukSlug = (slug && SERVICE_SLUG_UK[slug]) || slug
    target = `/uk/poslugy${ukSlug ? `/${ukSlug}` : ''}`
  } else if (section === 'blog') {
    if (tail[0] === 'kategoriya' && tail[1]) {
      const cat = CATEGORY_SLUG_UK[tail[1]] ?? tail[1]
      target = `/uk/blog/kategoriya/${cat}`
    } else if (tail.length >= 1) {
      const ukSegs = tail.map((s) => BLOG_SLUG_UK[s] ?? s)
      target = `/uk/blog/${ukSegs.join('/')}`
    } else {
      target = '/uk/blog'
    }
  } else if (section === 'tseny') {
    target = '/uk/tsiny'
  } else if (section === 'ob-avtore') {
    target = '/uk/pro-avtora'
  } else {
    target = `/uk/${segs.join('/')}`
  }

  return withTrailingSlash(target)
}
