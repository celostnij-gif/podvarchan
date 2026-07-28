/**
 * Blog list loading skeleton
 */
export default function BlogLoading() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-8 w-24 bg-zinc-800 rounded-lg animate-pulse" />
        <div className="h-10 w-36 bg-zinc-800 rounded-lg animate-pulse" />
      </div>

      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-zinc-800/50 border border-zinc-800/50 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  )
}
