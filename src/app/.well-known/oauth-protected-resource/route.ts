import { NextResponse } from 'next/server'
import { SITE } from '@/constants'

const ISSUER = SITE.url

export async function GET() {
  const metadata = {
    resource: ISSUER,
    authorization_servers: [ISSUER],
    scopes_supported: ['openid', 'profile', 'email', 'admin'],
    bearer_methods_supported: ['header'],
    resource_signing_alg_values_supported: ['RS256'],
    resource_documentation: `${ISSUER}/api/docs`,
  }

  return NextResponse.json(metadata, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
