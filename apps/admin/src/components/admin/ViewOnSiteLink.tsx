import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://podvarchan.com'

/**
 * "View on site" link — opens the public page in a new tab.
 * Only render when the entity is PUBLISHED and has a slug.
 */
export default function ViewOnSiteLink({
  href,
  label = 'Переглянути',
}: {
  href: string
  label?: string
}) {
  const fullUrl = href.startsWith('http')
    ? href
    : `${SITE_URL}${href}`

  return (
    <a
      href={fullUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
      title="Відкрити на сайті"
    >
      <ExternalLink className="w-3 h-3" />
      {label}
    </a>
  )
}
