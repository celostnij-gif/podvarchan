'use client'

/**
 * Shared field components for block editors.
 * Consistent styling with the admin dark theme.
 */

interface FieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
}

export function TextField({ label, value, onChange, placeholder, required }: FieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500
                   focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
      />
    </div>
  )
}

export function TextareaField({ label, value, onChange, placeholder, required }: FieldProps & { rows?: number }) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500
                   focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
      />
    </div>
  )
}

export function ToggleField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          value ? 'bg-green-600' : 'bg-zinc-700'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
            value ? 'translate-x-4.5' : 'translate-x-1'
          }`}
        />
      </button>
      <span className="text-xs font-medium text-zinc-300">{label}</span>
    </label>
  )
}

/**
 * Image field — accepts a URL and shows a preview.
 * For now uses simple URL input; later can integrate MediaPicker.
 */
export function ImageField({ label, value, onChange, placeholder }: FieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1">{label}</label>
      {value && (
        <div className="mb-2 overflow-hidden rounded-lg border border-zinc-700/50">
          <img
            src={value}
            alt="Preview"
            className="max-h-32 w-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? '/images/...'}
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500
                     focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 font-mono"
        />
        <button
          type="button"
          className="shrink-0 rounded-lg bg-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-600 transition-colors"
          onClick={() => alert('Медиатека будет подключена позже')}
        >
          🖼 Выбрать
        </button>
      </div>
    </div>
  )
}
