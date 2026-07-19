/**
 * Preview token — HMAC-signed payload for DRAFT preview on the public site.
 *
 * Uses the Web Crypto API (globalThis.crypto.subtle) so it works on both
 * the admin worker (Node.js runtime) and the public worker (Edge/Workers runtime).
 *
 * Token format: base64url(JSON).base64url(HMAC-SHA256(JSON))
 * The cookie `__preview` holds the full signed string.
 *
 * Flow:
 *   1. Admin → POST /api/preview/sign { entityType, slug, locale, redirect }
 *   2. Public /api/preview?token=...&redirect=... → verify → set cookie → redirect
 *   3. Public helpers read cookie → allow DRAFT if token matches entity
 */

const SECRET = process.env.PREVIEW_SECRET || process.env.REVALIDATE_SECRET || ''
const MAX_AGE = 3600 // 1 hour

export interface PreviewPayload {
  entityType: string
  slug: string
  locale: string
  exp: number
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export async function signPreviewToken(
  payload: Omit<PreviewPayload, 'exp'>,
): Promise<string> {
  if (!SECRET) throw new Error('PREVIEW_SECRET not configured')
  const data: PreviewPayload = { ...payload, exp: Date.now() + MAX_AGE * 1000 }
  const json = JSON.stringify(data)
  const jsonBytes = encoder.encode(json)
  const key = await getKey()
  const sig = await crypto.subtle.sign('HMAC', key, jsonBytes)
  return toBase64Url(jsonBytes) + '.' + toBase64Url(new Uint8Array(sig))
}

export async function verifyPreviewToken(
  token: string,
): Promise<PreviewPayload | null> {
  if (!SECRET || !token.includes('.')) return null
  try {
    const [b64Json, b64Sig] = token.split('.', 2)
    const jsonBytes = fromBase64Url(b64Json)
    const sigBytes = fromBase64Url(b64Sig)
    const key = await getKey()
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      jsonBytes,
    )
    if (!valid) return null
    const payload: PreviewPayload = JSON.parse(decoder.decode(jsonBytes))
    if (Date.now() > payload.exp) return null
    return payload
  } catch {
    return null
  }
}

/**
 * Read __preview cookie from a Request (API route) or NextRequest.
 */
export function readPreviewCookie(req: {
  cookies: { get: (name: string) => { value?: string } | undefined }
}): string | null {
  return req.cookies.get('__preview')?.value ?? null
}

/**
 * Check if the preview cookie grants access to a specific entity.
 */
export async function canPreview(
  cookie: string | null,
  entityType: string,
  slug: string,
): Promise<boolean> {
  if (!cookie) return false
  const payload = await verifyPreviewToken(cookie)
  if (!payload) return false
  return payload.entityType === entityType && payload.slug === slug
}
