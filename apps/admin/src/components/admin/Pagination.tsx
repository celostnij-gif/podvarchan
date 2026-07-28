import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  baseUrl: string
}

export default function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages: (number | 'ellipsis')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 2) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== 'ellipsis') {
      pages.push('ellipsis')
    }
  }

  function pageUrl(page: number) {
    const params = new URLSearchParams()
    params.set('page', String(page))
    return `${baseUrl}?${params.toString()}`
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      {currentPage > 1 && (
        <Link
          href={pageUrl(currentPage - 1)}
          className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Назад
        </Link>
      )}

      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`e${i}`} className="px-2 text-zinc-500">...</span>
        ) : (
          <Link
            key={p}
            href={pageUrl(p)}
            className={`flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
              p === currentPage
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {p}
          </Link>
        )
      )}

      {currentPage < totalPages && (
        <Link
          href={pageUrl(currentPage + 1)}
          className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
        >
          Далі
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  )
}
