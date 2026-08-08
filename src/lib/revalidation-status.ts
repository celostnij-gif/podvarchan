type CloudflareEnvelope = { success?: unknown }

export function cloudflarePurgeSucceeded(httpOk: boolean, body: unknown): boolean {
  return httpOk && typeof body === 'object' && body !== null && (body as CloudflareEnvelope).success === true
}