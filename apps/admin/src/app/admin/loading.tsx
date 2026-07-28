/**
 * Dashboard loading skeleton — stat cards
 */
export default function AdminLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="h-8 w-48 bg-zinc-800 rounded-lg animate-pulse" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 space-y-3">
            <div className="w-8 h-8 bg-zinc-700 rounded-lg animate-pulse" />
            <div className="h-4 w-24 bg-zinc-700 rounded animate-pulse" />
            <div className="h-8 w-16 bg-zinc-700 rounded animate-pulse" />
          </div>
        ))}
      </div>

      <div className="h-64 bg-zinc-800/30 border border-zinc-800/50 rounded-xl animate-pulse" />
    </div>
  )
}
