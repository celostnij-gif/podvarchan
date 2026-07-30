import { getCloudflareContext } from '@opennextjs/cloudflare'

export const runtime = 'edge'

export async function GET() {
  try {
    const { env } = getCloudflareContext()
    const kv = env['KV_BINDING'] as KVNamespace | undefined

    if (!kv) {
      return Response.json({ status: 'kv_not_available', kvBinding: false })
    }

    // Try to list d1c:* keys
    const { keys } = await kv.list({ prefix: 'd1c:' })

    // Try to get a specific known key
    const knownKeys = ['d1c:nav:HEADER:ru', 'd1c:nav:HEADER:uk']
    const values = await Promise.all(
      knownKeys.map(async (k) => {
        const val = await kv.get(k)
        return { key: k, exists: val !== null, size: val ? val.length : 0 }
      }),
    )

    return Response.json({
      status: 'ok',
      kvBindingExists: !!kv,
      d1cKeys: keys.map((k) => ({ name: k.name, expiration: k.expiration })),
      keyCount: keys.length,
      knownKeys: values,
      env: Object.keys(env).filter((k) => !k.includes('SECRET') && !k.includes('TOKEN')),
    })
  } catch (err) {
    return Response.json({
      status: 'error',
      error: String(err),
      message: err instanceof Error ? err.message : undefined,
      stack: err instanceof Error ? err.stack : undefined,
    })
  }
}
