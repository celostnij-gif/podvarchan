'use client'

import { Eye } from 'lucide-react'

/**
 * "Переглянути" button — opens the public page in preview mode.
 * Generates a signed __preview cookie via /api/preview/sign (admin worker).
 *
 * entityType: 'blog_post' | 'service' | 'page' | 'faq' | 'testimonial'
 * slug: the translation slug (used in the public URL and preview token)
 * locale: 'ru' | 'uk' (default 'ru')
 * publicPath: the public path to redirect to (e.g. /ru/blog/{slug})
 */
export default function PreviewButton({
  entityType,
  slug,
  locale = 'ru',
  publicPath,
  disabled = false,
}: {
  entityType: string
  slug: string
  locale?: string
  publicPath: string
  disabled?: boolean
}) {
  function handlePreview() {
    // window.location.origin = admin.podvarchan.com (the sign endpoint lives on the admin worker)
    const signUrl = new URL('/api/preview/sign', window.location.origin)
    signUrl.searchParams.set('entityType', entityType)
    signUrl.searchParams.set('slug', slug)
    signUrl.searchParams.set('locale', locale)
    signUrl.searchParams.set('redirect', publicPath)
    window.open(signUrl.toString(), '_blank')
  }

  return (
    <button
      type="button"
      onClick={handlePreview}
      disabled={disabled || !slug}
      className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      title="Переглянути на сайті (DRAFT)"
    >
      <Eye className="w-3.5 h-3.5" />
      Переглянути
    </button>
  )
}
