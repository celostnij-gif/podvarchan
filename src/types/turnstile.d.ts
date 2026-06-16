/**
 * Type declarations for Cloudflare Turnstile widget.
 * Provides type-safe access to window.turnstile without `as any`.
 */

interface TurnstileRenderOptions {
  sitekey: string
  action?: string
  cData?: string
  callback?: (token: string) => void
  'expired-callback'?: () => void
  'error-callback'?: (error: Error) => void
  'timeout-callback'?: () => void
  'before-interactive-callback'?: () => void
  'after-interactive-callback'?: () => void
  'unsupported-callback'?: () => void
  theme?: 'light' | 'dark' | 'auto'
  language?: string
  tabindex?: number
  'response-field'?: boolean
  'response-field-name'?: string
  size?: 'normal' | 'compact' | 'flexible'
  retry?: 'auto' | 'never'
  'retry-interval'?: number
  'refresh-expired'?: 'auto' | 'manual' | 'never'
  appearance?: 'always' | 'execute' | 'interaction-only'
}

interface TurnstileWidget {
  render: (
    container: HTMLElement | null,
    options: TurnstileRenderOptions,
  ) => string | undefined
  remove: (container: HTMLElement | null) => void
  getResponse: (widgetId?: string) => string | undefined
  reset: (widgetId?: string) => void
}

interface Window {
  turnstile?: TurnstileWidget
}
