const PUBLIC_PATH = /^\/(ru|uk)(?:\/[a-z0-9][a-z0-9-]*)*\/$/

export type MdTargetValidation =
  | { ok: true; url: URL }
  | { ok: false; reason: 'invalid-url' | 'invalid-origin' | 'invalid-path' }

export function validateMdTarget(raw: string, canonicalOrigin: string): MdTargetValidation {
  let target: URL
  let canonical: URL
  try { target = new URL(raw); canonical = new URL(canonicalOrigin) }
  catch { return { ok: false, reason: 'invalid-url' } }
  if (target.protocol !== 'https:' || canonical.protocol !== 'https:' || target.username || target.password || target.port || target.search || target.hash || target.origin !== canonical.origin) {
    return { ok: false, reason: 'invalid-origin' }
  }
  if (!PUBLIC_PATH.test(target.pathname) || target.pathname.includes('//')) return { ok: false, reason: 'invalid-path' }
  return { ok: true, url: target }
}