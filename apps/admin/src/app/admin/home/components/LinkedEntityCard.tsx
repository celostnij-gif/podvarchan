import Link from 'next/link'

interface LinkedEntityCardProps {
  label: string
  count: number
  href: string
  accent?: boolean
}

export function LinkedEntityCard({ label, count, href, accent }: LinkedEntityCardProps) {
  return (
    <div className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
      accent ? 'border-amber-500/20 bg-amber-500/5' : 'border-zinc-700/50 bg-zinc-800/30'
    }`}>
      <div>
        <p className="text-sm font-medium text-zinc-200">{label}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{count} {count === 1 ? 'елемент' : count < 5 ? 'елементи' : 'елементів'}</p>
      </div>
      <Link
        href={href}
        className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
      >
        Керувати →
      </Link>
    </div>
  )
}
