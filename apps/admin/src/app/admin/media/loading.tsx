/**
 * Media grid loading skeleton
 */
export default function MediaLoading() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-8 w-28 bg-zinc-800 rounded-lg animate-pulse" />
        <div className="h-10 w-36 bg-zinc-800 rounded-lg animate-pulse" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="aspect-square bg-zinc-800/50 border border-zinc-800/50 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  )
}
