/**
 * Home (zone editor) loading skeleton
 */
export default function HomeLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="h-8 w-48 bg-zinc-800 rounded-lg animate-pulse" />

      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border border-zinc-800/50 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-6 w-40 bg-zinc-700 rounded animate-pulse" />
              <div className="h-8 w-24 bg-zinc-700 rounded-lg animate-pulse" />
            </div>
            <div className="h-32 bg-zinc-800/30 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
