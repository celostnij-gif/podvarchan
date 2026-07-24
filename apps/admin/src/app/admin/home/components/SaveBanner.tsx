'use client'

interface SaveBannerProps {
  state: 'idle' | 'saving' | 'saved' | 'error'
  errorMessage?: string
}

export function SaveBanner({ state, errorMessage }: SaveBannerProps) {
  if (state === 'idle') return null

  const config = {
    saving: { text: 'Збереження...', className: 'bg-blue-900/30 text-blue-400 border-blue-700/30' },
    saved: { text: 'Збережено', className: 'bg-green-900/30 text-green-400 border-green-700/30' },
    error: { text: errorMessage ?? 'Помилка збереження', className: 'bg-red-900/30 text-red-400 border-red-700/30' },
  }[state]

  return (
    <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg border text-sm font-medium shadow-lg z-50 ${config.className}`}>
      {state === 'saving' && (
        <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      )}
      {config.text}
    </div>
  )
}
