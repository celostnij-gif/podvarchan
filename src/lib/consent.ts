/* ── Cookie consent management ── */

const CONSENT_KEY = 'cookie-consent'

export type ConsentStatus = 'accepted' | 'declined' | null

/**
 * Reads the current cookie consent status from localStorage.
 */
export function getConsent(): ConsentStatus {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(CONSENT_KEY) as ConsentStatus
}

/**
 * Saves cookie consent status to localStorage.
 */
export function setConsent(status: 'accepted' | 'declined'): void {
  try {
    localStorage.setItem(CONSENT_KEY, status)
  } catch {
    // localStorage might be unavailable in some edge cases
  }
}

/**
 * Returns true if the user has accepted cookies.
 */
export function hasConsent(): boolean {
  return getConsent() === 'accepted'
}
